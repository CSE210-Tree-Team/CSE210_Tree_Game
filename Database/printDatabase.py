import sqlite3
import os

# Credit to Gemini for generating this script.
# I would suggest running this with redirection to a file for easier viewing:
# python Database/print_database.py > db_dump.txt

DB_NAME = "game_database.db"

def print_database_contents():
    # Check if DB exists
    if not os.path.exists(DB_NAME):
        print(f"Error: Database '{DB_NAME}' not found.")
        print("Please run your generation script first.")
        return

    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    # 1. Get a list of all tables in the database dynamically
    # We exclude 'sqlite_sequence' which is an internal SQLite table for autoincrement keys
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name != 'sqlite_sequence';")
    tables = cursor.fetchall()

    if not tables:
        print("Connected to database, but no tables found.")
        return

    print(f"Successfully connected to {DB_NAME}\n")

    # 2. Iterate through every table and print contents
    for table_name_tuple in tables:
        table_name = table_name_tuple[0]
        
        print(f"{'='*20} TABLE: {table_name} {'='*20}")
        
        # Get all data
        try:
            cursor.execute(f"SELECT * FROM {table_name}")
            rows = cursor.fetchall()
            
            # Get column headers
            # cursor.description returns a tuple of descriptions, index 0 is the column name
            column_names = [description[0] for description in cursor.description]
            
            # Print Headers
            print(f"COLUMNS: {column_names}")
            print("-" * (len(str(column_names)) + 10))

            # Print Rows
            if not rows:
                print("   [EMPTY TABLE] - No data rows found.")
            else:
                for row in rows:
                    print(f"   {row}")
            
            print("\n") # Add spacing between tables

        except sqlite3.OperationalError as e:
            print(f"Could not read table {table_name}: {e}")

    conn.close()
    print("End of Database Dump.")

if __name__ == "__main__":
    print_database_contents()