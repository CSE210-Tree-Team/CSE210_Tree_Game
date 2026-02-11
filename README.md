# CSE210_Tree_Game

## To Run Locally:
```
# Note, you may need Python 3.12.3; without it, consider setting up through Conda
cd CSE210_Tree_Game

python3 -m venv .venv
source .venv/bin/activate

pip install --upgrade pip
pip install -r server/requirements.txt

python server/main.py
```

## Database:
To create the database, from within the `server` directory run `python -m Database.createDatabase`.  
To fill with test data, from within the `server` directory run `python -m Database.generateTestData`.  
To view current state of the database, from within the `server` directory run `python -m Database.printDatabase`. You may want to redirect the output into a text file.  

For getting organized dictionaries from the database, please reference `server/Database/getItemsFromDatabase.py`. When calling these functions, use the username. Similarly, please reference `server/Database/addItemsToDatabase.py` for any function calls that will update the database.

To test the database, as per the GitHub Actions, from within the `server` directory run both: `python -m Database.databaseInteractUnitTests` and `python -m Database.databaseUnitTests`.

## Home Page:
1. First, cd to Home page. And then, run `npm install`. (you should configure npm if u don't have it installed yet lol)
2. Then, run `npm run build` to start the server. 
3. This needs to be statically compiled with `npm run build` while in the `Home Page` directory


## Account Info:
Currently, an email may only be associated to one account. Upon account creation, a tree will also be created.

### LLM Credits:
- Gemini was used to generate printDatabase.py
- Gemini was used to help with some of the addItemsToDatabase.py and getItemsFromDatabase.py
- Gemini was used to help create the databaseInteractUnitTests.
- Gemini was used to help with authentication and combining FastAPI with React Home Page
- Gemini was used to help create the .github workflow to automatically run tests.
- Gemini was used to help create a summary docstring for each file in the Database module.
