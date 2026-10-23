import json
import os
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
import motor.motor_asyncio
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from app.config.settings import settings

class LocalCollectionFallback:
    """Thread-safe persistent local storage mimicking Motor collection interface."""
    def __init__(self, name: str, filepath: str):
        self.name = name
        self.filepath = filepath
        self._data: List[Dict[str, Any]] = []
        self._load()

    def _load(self):
        if os.path.exists(self.filepath):
            try:
                with open(self.filepath, "r", encoding="utf-8") as f:
                    self._data = json.load(f)
            except Exception:
                self._data = []
        else:
            self._data = []

    def _save(self):
        os.makedirs(os.path.dirname(self.filepath), exist_ok=True)
        with open(self.filepath, "w", encoding="utf-8") as f:
            json.dump(self._data, f, indent=2, default=str)

    async def find_one(self, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        for doc in self._data:
            match = True
            for k, v in query.items():
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                return dict(doc)
        return None

    def find(self, query: Optional[Dict[str, Any]] = None):
        return LocalCursor(self._data, query)

    async def insert_one(self, doc: Dict[str, Any]):
        doc_copy = dict(doc)
        if "_id" not in doc_copy:
            doc_copy["_id"] = str(uuid.uuid4())
        if "created_at" not in doc_copy:
            doc_copy["created_at"] = datetime.utcnow().isoformat()
        self._data.append(doc_copy)
        self._save()
        
        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertResult(doc_copy["_id"])

    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any], upsert: bool = False):
        set_fields = update.get("$set", update)
        for i, doc in enumerate(self._data):
            match = True
            for k, v in query.items():
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                self._data[i].update(set_fields)
                self._data[i]["updated_at"] = datetime.utcnow().isoformat()
                self._save()
                
                class UpdateResult:
                    matched_count = 1
                    modified_count = 1
                return UpdateResult()
        
        if upsert:
            new_doc = dict(query)
            new_doc.update(set_fields)
            if "_id" not in new_doc:
                new_doc["_id"] = str(uuid.uuid4())
            new_doc["created_at"] = datetime.utcnow().isoformat()
            self._data.append(new_doc)
            self._save()
            
            class UpdateResultUpsert:
                matched_count = 0
                modified_count = 1
            return UpdateResultUpsert()

        class NoMatch:
            matched_count = 0
            modified_count = 0
        return NoMatch()

    async def delete_one(self, query: Dict[str, Any]):
        for i, doc in enumerate(self._data):
            match = True
            for k, v in query.items():
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                self._data.pop(i)
                self._save()
                class DelResult:
                    deleted_count = 1
                return DelResult()
        class NoDel:
            deleted_count = 0
        return NoDel()

    async def delete_many(self, query: Dict[str, Any]):
        initial_len = len(self._data)
        self._data = [
            doc for doc in self._data
            if not all(doc.get(k) == v for k, v in query.items())
        ]
        deleted = initial_len - len(self._data)
        self._save()
        class DelManyResult:
            deleted_count = deleted
        return DelManyResult()

    async def count_documents(self, query: Optional[Dict[str, Any]] = None) -> int:
        if not query:
            return len(self._data)
        count = 0
        for doc in self._data:
            if all(doc.get(k) == v for k, v in query.items()):
                count += 1
        return count


class LocalCursor:
    def __init__(self, data: List[Dict[str, Any]], query: Optional[Dict[str, Any]] = None):
        self._items = []
        if not query:
            self._items = [dict(d) for d in data]
        else:
            for doc in data:
                if all(doc.get(k) == v for k, v in query.items()):
                    self._items.append(dict(doc))
        self._sort_key = None
        self._sort_dir = 1
        self._limit_val = None

    def sort(self, key_or_list, direction: int = 1):
        if isinstance(key_or_list, list):
            self._sort_key = key_or_list[0][0]
            self._sort_dir = key_or_list[0][1]
        else:
            self._sort_key = key_or_list
            self._sort_dir = direction
        return self

    def limit(self, count: int):
        self._limit_val = count
        return self

    async def to_list(self, length: Optional[int] = None) -> List[Dict[str, Any]]:
        results = list(self._items)
        if self._sort_key:
            results.sort(
                key=lambda x: str(x.get(self._sort_key, "")),
                reverse=(self._sort_dir == -1)
            )
        lim = self._limit_val if self._limit_val is not None else length
        if lim is not None:
            results = results[:lim]
        return results

    def __aiter__(self):
        self._iter_list = list(self._items)
        self._index = 0
        return self

    async def __anext__(self):
        if self._index < len(self._iter_list):
            item = self._iter_list[self._index]
            self._index += 1
            return item
        raise StopAsyncIteration


class DatabaseManager:
    def __init__(self):
        self.is_connected = False
        self.use_fallback = False
        self.client = None
        self.db = None
        self.fallback_dir = os.path.join(os.getcwd(), "data", "storage")
        os.makedirs(self.fallback_dir, exist_ok=True)
        self.fallback_collections: Dict[str, LocalCollectionFallback] = {}

    async def connect(self):
        try:
            self.client = motor.motor_asyncio.AsyncIOMotorClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=2000
            )
            # Test connection
            await self.client.admin.command('ping')
            self.db = self.client[settings.MONGODB_DB_NAME]
            self.is_connected = True
            self.use_fallback = False
            print("[Database] Successfully connected to MongoDB.")
        except Exception as e:
            print(f"[Database] MongoDB not available ({e}). Using persistent Local Storage fallback.")
            self.use_fallback = True
            self.is_connected = True

    async def disconnect(self):
        if self.client:
            self.client.close()
            print("[Database] Disconnected from MongoDB.")

    def get_collection(self, name: str):
        if not self.use_fallback and self.db is not None:
            return self.db[name]
        
        if name not in self.fallback_collections:
            filepath = os.path.join(self.fallback_dir, f"{name}.json")
            self.fallback_collections[name] = LocalCollectionFallback(name, filepath)
        return self.fallback_collections[name]

db_manager = DatabaseManager()

def get_collection(name: str):
    return db_manager.get_collection(name)
