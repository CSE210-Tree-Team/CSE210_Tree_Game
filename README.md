# CSE210_Tree_Game

## To Run Locally:
```
cd CSE210_Tree_Game

python3 -m venv .venv
source .venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt
```

## Database:
To create the database, run `python Database/createDatabase.py`  
To fill with test data, run `python Database/generateTestData.py`  
To view current state of the database, run `python Database/printDatabase.py`. You may want to redirect the output into a text file.  

For getting organized dictionaries from the database, please reference `Database/getItemsFromDatabase.py`. When calling these functions, use the user_ref instead of the user_ID.