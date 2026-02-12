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

## Tree:
The tree will gradually decay with time; this rate can be found in constants.py as PASSIVE_DECAY_RATE, but will typically be a 1 percent decay every 30 minutes. 

Decaying currently occurs passively and is done directly through update_stats, without the explicit addition of Events to the database, although this functionality may be updated to account for updating events. Tests for updating stats can be run by going into the server folder and running `python3 -m unittest tests.databaseStatUpdateTests -v`.

## API Calls:
API tests can be run with `python -m unittest apiRoutesTests -v`. **Note that all API calls besides /api/auth/verify require the user to be authenticated.**

- `/api/auth/verify` -- This should primarily only be used by OAuth0 and is mostly an internal API call to ensure log-in and proper synchronization between our local database and Auth0's.
- `/api/get-user-info` -- This performs passive tree decay first, then returns the users information in a JSON format with three fields: `success`, `user`, and `tree`. The User field contains the `username` - which is the unique user ID, the `displayName`, the `email`, and the user's `roles`. The Tree contains the `treeID`, the `health`, the `growthStage`, and the `resourceLevels`, which is a dictionary in the form of: `{"water": int, "earth": int, "sun": int}`.
- `/api/update-stat` -- This allows mini-games (and/or events as necessary) to update a stat of their choosing. Options currently include 'Water', 'Earth', and 'Sun'. The requeset body must have two fields: `stat_name` and `value`. The API will then update the given stat by value amount, following max and min limitations for the stat. Note that value can be either negative or positive for increasing or decreasing the stat, although mini-games will typically increase the stat.
- `/api/add-question` -- Allows for adding a question to the database. It takes in a JSON request body with the following fields: `text`, `question_type` - defined in constants.py, `resource_type`, `choices` : `[str]`, `correct_choices` : `[int]`, `check_duplicates`. Note that there can be multiple correct choice indexes for a question, especially for MultiSelect questions. Duplicate checking is enabled by default and means that duplicate questions will not be added to the database. If successful, this will return a JSON consisting of `success` : `bool`, `message` : `Question added successfully`, and `questionID`.
- `/api/get-question` -- Retrieves a single question from the database by its ID. It takes in a JSON request body with a `questionID` field and returns a JSON with `success` : `bool` and `question` containing the `questionID`, `text`, `choices` : `[str]`, and `correct_choices` : `[int]` fields.
- `/api/get-questions` -- Retrieves multiple questions from the database with optional filtering. It takes in a JSON request body with optional fields: `numQuestions` - maximum number of questions to return, `resourceType` - filter by resource type, `questionType` - filter by question type, and `difficulty` - filter by difficulty level. Returns a JSON with `success` : `bool`, `count` : `int`, and `questions` : `[question]` where each question contains `questionID`, `text`, `type`, `difficulty`, `resourceType`, and `choices`. Note that all input fields are optional.

## Account Info:
Currently, an email may only be associated to one account. Upon account creation, a tree will also be created.

### LLM Credits:
- Gemini was used to generate printDatabase.py
- Gamini was used to help with some of the addItemsToDatabase.py and getItemsFromDatabase.py
- Gemini was used to help create the databaseInteractUnitTests, apiRoutesTests, and databaseStatUpdateTests.
- Gemini was used to help with authentication and combining FastAPI with React Home Page
- Gemini was used to help create the .github workflow to automatically run tests.
- Gemini was used to help create a summary docstring for each file in the Database module.