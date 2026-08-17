from database import DataStore
from typing import List
from models import EOLayer

def get_eo_layers(db: DataStore) -> List[EOLayer]:
    return db.eo_layers
