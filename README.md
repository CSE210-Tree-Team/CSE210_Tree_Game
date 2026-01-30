# CSE210_Tree_Game

## To Run Locally:
```
cd CSE210_Tree_Game

python3 -m venv .venv
source .venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt

python main.py
```

## Database:
To create the database, run `python -m Database.createDatabase`  
To fill with test data, run `python -m Database.generateTestData`  
To view current state of the database, run `python -m Database.printDatabase`. You may want to redirect the output into a text file.  

For getting organized dictionaries from the database, please reference `Database/getItemsFromDatabase.py`. When calling these functions, use the username. Similarily, please reference `Database/addItemsToDatabase.py` for any function calls that will update the database.

To test the database, as per the GitHub Actions, run both: `python -m Database.databaseInteractUnitTests` and `python -m Database.databaseUnitTests`.

## Home Page:
This needs to be statically compiled with `npm run build` while in the `Home Page` directory


## Account Info:
Currently, an email may only be associated to one account. Upon account creation, a tree will also be created.

### LLM Credits:
- Gemini was used to generate printDatabase.py
- Gamini was used to help with some of the addItemsToDatabase.py and getItemsFromDatabase.py
- Gemini was used to help create the databaseInteractUnitTests.
- Gemini was used to help with authentication and combining FastAPI with React Home Page
- Gemini was used to help create the .github workflow to automatically run tests.
- Gemini was used to help create a summary docstring for each file in the Database module.