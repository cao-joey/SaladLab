# Smart Salad Builder Web App
Full-stack web app that helps users create salads or discover recipes based on the ingredients they have.

## Setup
Before cloning the repository, please make sure you have the following: 
1. Node.js
2. npm
3. Docker

Once you have installed everything, you'll want to setup your own docker container. To do this:
```
docker run --name my-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=mydb \
  -p 5432:5432 \
  -d postgres:16
```
Once you have your container running, create your own `.env` file and copy the line from the `.env.example`, 
replacing the link with your own database information.

Now, install dependencies with `npm install` 

We now want to import all data into the database: --> (all data not uploaded yet, please hold)
1. Find the `data` folder (You will find a `ingredients_data` JSON file as well as a `seedingredients.ts` script)
2. Run the `.ts` script: `npx tsx seedingredients.ts`
3. (eventually, recipes as well)

Once that's all done, you can run `npm start` to begin the application.

## Modes:

### 1. Regular
- Users start by entering ingredients into an interactive input field with autocomplete suggestions
- Input supports normalization (e.g., “garbanzo beans” -> “chickpeas”)
- As ingredients are added:
  - System recommends additional complementary ingredients
  - System matches and ranks existing salad recipes from the database

### 2. Pantry
- Users input all ingredients they currently have
- System returns recipe suggestions ranked by match quality
- Each recipe shows:
  - Ingredients the user already has
  - Missing ingredients
  - Optional ingredients
  - Match percentage or completeness score

### 3. Browse mode 
- Users can just freely look up recipes :) 
- Randomized display of recipes from the database
- OR: Users can browse based on tags, protein types, etc!
