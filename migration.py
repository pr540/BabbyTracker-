import sqlite3

def migrate():
    try:
        conn = sqlite3.connect('baby_tracker.db')
        cursor = conn.cursor()
        
        # Check if gender column exists in babies table
        cursor.execute("PRAGMA table_info(babies)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'gender' not in columns:
            print("Adding 'gender' column...")
            cursor.execute("ALTER TABLE babies ADD COLUMN gender TEXT DEFAULT 'Girl'")
        if 'birth_date' not in columns:
            print("Adding 'birth_date' column...")
            cursor.execute("ALTER TABLE babies ADD COLUMN birth_date TEXT")
        if 'weight' not in columns:
            print("Adding 'weight' column...")
            cursor.execute("ALTER TABLE babies ADD COLUMN weight TEXT")
            
        conn.commit()
        print("Migration check complete.")
            
        conn.close()
    except Exception as e:
        print(f"Migration error: {e}")

if __name__ == "__main__":
    migrate()
