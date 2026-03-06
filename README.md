# CSE210_Tree_Game

## Quick Start (Automated Setup):

After cloning the repository and setting up the .env file, you can use the automated setup script:

```bash
./start.sh
```

This script will:
- Remove the old database
- Create a fresh database
- Populate it with default questions
- Start both the backend server and frontend client

Access the application at: http://localhost:5173/

Press Ctrl+C **twice** to stop both servers.

## Deploying To Railway (Production)

Use the repository `Dockerfile` for Railway deployment.

Important:
- Do not run `./start.sh` on Railway. It is for local development only.
- Do not set public networking to port `5173` (that is the local Vite dev server).
- Let Railway inject `PORT` and route traffic to the backend process.

Recommended Railway service settings:
- Builder: `Dockerfile`
- Start command override: empty (use Docker `CMD`)
- Public networking target port: `8000` (or auto-detect)

Required Railway environment variables:
- `MIDDLEWARE_SECRET_KEY` = strong random string
- `CLEAR_SESSIONS_ON_RESTART` = `false`
- `VITE_AUTH0_DOMAIN` = your Auth0 tenant domain
- `VITE_AUTH0_CLIENT_ID` = your Auth0 client id
- `EMAIL_PASSWORD` = sender mailbox app password (if email features are used)

Auth0 app settings must include your Railway URL in:
- Allowed Callback URLs
- Allowed Logout URLs
- Allowed Web Origins

## Initial Setup:

1. Clone the Repository
2. Set up the `.env` file in the repository root. Note: it is on discord for members of our group.
   - VITE_AUTH0_DOMAIN =
   - VITE_AUTH0_CLIENT_ID =
   - AUTH0_CLIENT_SECRET =
   - MIDDLEWARE_SECRET_KEY =
   - EMAIL_PASSWORD = 
   - SESSION_MAX_AGE =
3. Create the database: `python -m database.createDatabase` (from the server directory)
4. Now set up the frontend and backend (instructions below).
5. Once completed, you can access the webpage at: http://localhost:5173/.

## To start the frontend:

```
cd client
npm install # if u haven't already
npm run dev
npm run test # run front end tests
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

## Testing:

### Frontend:
```bash
cd client
npm run test
```

### Backend (from server directory):

Run all tests:
```bash
python -m unittest discover -s . -p "*Test.py" -v
```

Run by test type:
```bash
python -m unittest discover -s . -p "*UnitTest.py" -v        # Unit tests
python -m unittest discover -s regression_tests -p "*.py" -v  # Regression tests
python -m unittest discover -s integration_tests -p "*.py" -v # Integration tests
```

**Note:** All API calls besides `/api/auth/verify` require authentication.

## Database:

From the server directory:

To create the database, run `python -m database.createDatabase`  
To view current state of the database, run `python -m database.printDatabase`. You may want to redirect the output into a text file.

For getting organized dictionaries from the database, please reference `server/database/getItemsFromDatabase.py`. When calling these functions, use the username. Similarly, please reference `server/database/addItemsToDatabase.py` for any function calls that will update the database.

## Questions:

To add questions, populate `server/utils/questions.json`. Then, run `python -m utils.addDefaultQuestions` from the server directory to add all of the questions to the database. Alternatively, when the app is running, authenticated posts to `/api/add-question` will also add questions. The format of a question is as follows. Note that `correct_choices` may contain several indices of correct choices:

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

The tree will gradually decay with time; this rate can be configured in the server settings, but will typically be a 1 percent decay every 30 minutes. Decaying occurs passively through update_stats without explicit event insertion.

## API Calls:

**Note:** Some endpoints currently use POST for data retrieval (e.g., `/api/get-question`, `/api/get-questions`). As a TODO, these should be refactored to use GET requests with query parameters or path parameters instead of POST with JSON bodies.

- **POST** `/api/auth/verify` -- This should primarily only be used by Auth0 and is mostly an internal API call to ensure log-in and proper synchronization between our local database and Auth0's. It takes a JSON request body with `user` data (email, sub, name, nickname).

- **GET** `/api/get-user-info` -- This performs passive tree decay first, then returns the user's information in a JSON format with three fields: `success`, `user`, and `tree`. The User field contains the `username` - which is the unique user ID, the `displayName`, the `email`, and the user's `roles`. The Tree contains the `treeID`, the `health`, the `growthStage`, and the `resourceLevels`, which is a dictionary in the form of: `{"water": int, "earth": int, "sun": int}`.

- **PUT** `/api/update-stat` -- This allows mini-games (and/or events as necessary) to update a stat of their choosing. Options currently include 'water', 'earth', and 'sun' (case-insensitive). The request body must have two fields: `stat_name` and `value`. The API will then update the given stat by value amount, following max and min limitations for the stat (0-100). Note that value can be either negative or positive for increasing or decreasing the stat, although mini-games will typically increase the stat.

- **POST** `/api/add-question` -- Allows for adding a question to the database. It takes in a JSON request body with the following fields: `text`, `question_type` ("MCQ", "MultiSelect", or "FreeResponse"), `resource_type` ("water", "earth", "sun", "general", or "none" - case-insensitive), `choices` : `[str]`, `correct_choices` : `[int]`, and optional `check_duplicates` (defaults to true). Note that `correct_choices` is a list of indices (0-based) that can contain multiple correct answer indices for MultiSelect questions. If successful, this will return a JSON consisting of `success` : `bool`, `message` : "Question added successfully", and `questionID`.

- **POST** `/api/get-question` -- Retrieves a single question from the database by its ID. It takes a JSON request body with `questionID` field. Returns a JSON with `success` : `bool` and `question` containing the `questionID`, `text`, `choices` : `[str]`, and `correct_choices` : `[int]` fields.

- **POST** `/api/get-questions` -- Retrieves multiple questions from the database with optional filtering. It takes in a JSON request body with optional fields: `numQuestions` - maximum number of questions to return (null for all), `resourceType` - filter by resource type, `questionType` - filter by question type, and `difficulty` - filter by difficulty level. Returns a JSON with `success` : `bool`, `count` : `int`, and `questions` : `[question]` where each question contains `questionID`, `text`, `type`, `difficulty`, `resourceType`, and `choices` (array of objects with `text` and `isCorrect` fields). Note that all fields in the request body are optional.

## Account Info:

Currently, an email may only be associated to one account. Upon account creation, a tree will also be created.

### LLM Credits:

- Gemini was used to generate printDatabase.py
- Gemini was used to help with some of the addItemsToDatabase.py and getItemsFromDatabase.py
- Gemini was used to help create the databaseInteractUnitTests, apiRoutesTests, and databaseStatUpdateTests.
- Gemini was used to help with authentication and combining FastAPI with React Home Page
- Gemini was used to help create the .github workflow to automatically run tests.
- Gemini was used to help create a summary docstring for each file in the Database module.
- AI tools were used to assist with refactoring the backend code structure in order to organize the codebase into well-defined modules (api, database, services, schemas, utils, config), and breaking functionality into manageable chunks for better maintainability.

