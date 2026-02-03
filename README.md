# CSE210_Tree_Game

## Initial Setup:
1) Clone the Repository
2) Set up the .env file and put it in the client folder. Note: it is on discord for members of our group.
    * VITE_AUTH0_DOMAIN = 
    * VITE_AUTH0_CLIENT_ID = 
    * AUTH0_CLIENT_SECRET = 
    * MIDDLEWARE_SECRET_KEY = 
3) Create the database: `python -m Database.createDatabase`
4) Now set up the frontend and backend (instructions below).
5) Once completed, you can acess the webpage at: http://localhost:5173/.

## To start the frontend:
```
cd client
npm install # if u haven't already
npm run dev
```

## To start the backend:
```
cd server
python -m venv .venv
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

## Questions:
To add questions, populate `utils/questions.json`. Then, run `python -m utils.addDefaultQuestions` from the parent directory to add all of the questions to the Database. Alternatively, when the app is running, verified posts to `/api/add-question` will also add non-duplicate questions. The format of a question is as follows. Note that `correct_choices` may contain several indices of correct choices:

```
{
"text": "What color is our sun?",
"question_type": "MCQ",
"resource_type": "Sun",
"choices": ["Yellow", "Green", "Blue"],
"correct_choices": [0]
}
```

## API Calls:
API tests can be run with `python -m unittest apiRoutesTests -v`

- `/api/add-question`
- `/api/add-questions`
- `/api/get-question`
- `/api/get-user-info`

## Account Info:
Currently, an email may only be associated to one account. Upon account creation, a tree will also be created.

### LLM Credits:
- Gemini was used to generate printDatabase.py
- Gamini was used to help with some of the addItemsToDatabase.py and getItemsFromDatabase.py
- Gemini was used to help create the databaseInteractUnitTests and the apiRoutesTests.
- Gemini was used to help with authentication and combining FastAPI with React Home Page
- Gemini was used to help create the .github workflow to automatically run tests.
- Gemini was used to help create a summary docstring for each file in the Database module.