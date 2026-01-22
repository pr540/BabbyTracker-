import pandas as pd
from datetime import datetime

# Data for yesterday and today prompts/tasks with detailed "Matter"
data = [
    # Yesterday - Jan 21
    {
        "Date": "2026-01-21", 
        "Category": "Feature", 
        "Prompt/Task": "Implement physical SMS OTP via Twilio API", 
        "Matter": "Replaced the simulated console output with real Twilio SMS capability. Configured environment variables (SID, TOKEN, PHONE) and added logic to auto-format phone numbers to +91 (India) for reliable delivery.",
        "Status": "Completed"
    },
    {
        "Date": "2026-01-21", 
        "Category": "UI/UX", 
        "Prompt/Task": "Remove on-screen OTP hints for security", 
        "Matter": "Modified verify_otp.html to stop displaying the code in the 'raw_otp' debug field, ensuring users must actually receive the SMS to log in.",
        "Status": "Completed"
    },
    {
        "Date": "2026-01-21", 
        "Category": "Feature", 
        "Prompt/Task": "Add 'Resend OTP' link to verification page", 
        "Matter": "Implemented a countdown-based or instant resend link that triggers a new random 4-digit code and dispatches a fresh SMS via the FastAPI backend.",
        "Status": "Completed"
    },
    {
        "Date": "2026-01-21", 
        "Category": "Bug Fix", 
        "Prompt/Task": "Fix CSS syntax error in progress bar", 
        "Matter": "Corrected line 103 of index.html where a curly brace was missing in the style='width: {{...}}%' attribute, which was causing the tracking bars to render as full width or empty.",
        "Status": "Completed"
    },
    
    # Today - Jan 22
    {
        "Date": "2026-01-22", 
        "Category": "Bug Fix", 
        "Prompt/Task": "Fix baby cry audio recording & upload", 
        "Matter": "Debugged the client-side MediaRecorder. Fixed the blob selection logic so that 5-second 'cry' clips are correctly captured and POSTed to the /cry endpoint with a unique filename.",
        "Status": "Completed"
    },
    {
        "Date": "2026-01-22", 
        "Category": "Feature", 
        "Prompt/Task": "Enable cry audio playback in activity logs", 
        "Matter": "Added HTML5 <audio> players to the 'Recent Activity' cards. Users can now click 'Play' on any cry event to hear the recording immediately.",
        "Status": "Completed"
    },
    {
        "Date": "2026-01-22", 
        "Category": "Feature", 
        "Prompt/Task": "Implement 8-hour night monitoring capture", 
        "Matter": "Configured the monitoring page to automatically start recording cycles during the 10 PM to 6 AM window. These long-form logs are stored in 'night_recordings' for morning review.",
        "Status": "Completed"
    },
    {
        "Date": "2026-01-22", 
        "Category": "UI/UX", 
        "Prompt/Task": "Add sleep goal progress bar", 
        "Matter": "Created a premium-styled progress indicator on the dashboard that calculates sleep duration against the recommended 8-hour daily target.",
        "Status": "Completed"
    },
    {
        "Date": "2026-01-22", 
        "Category": "Bug Fix", 
        "Prompt/Task": "Resolve 500 server error on monitoring dashboard", 
        "Matter": "Fixed a NullReference error in main.py where the dashboard was attempting to access 'baby' attributes before a baby was registered or when session data was stale.",
        "Status": "Completed"
    },
    {
        "Date": "2026-01-22", 
        "Category": "Optimization", 
        "Prompt/Task": "Upgrade backend to JSON-response", 
        "Matter": "Switched recording and task logging endpoints to return JSON instead of full HTML redirects. This allows the UI to update markers and activity feeds instantly without a page refresh.",
        "Status": "Completed"
    },
    {
        "Date": "2026-01-22", 
        "Category": "Documentation", 
        "Prompt/Task": "Create detailed Excel Log with Matter", 
        "Matter": "Compiled all coding prompts, bug fixes, and feature implementations into a structured Excel file (BabbyTracker_Prompts_Log.xlsx) with technical descriptions of each change.",
        "Status": "Completed"
    },
    {
        "Date": "2026-01-22", 
        "Category": "Bug Fix", 
        "Prompt/Task": "Resolve IDE CSS parsing errors in monitor.html", 
        "Matter": "Completely removed Jinja syntax from the inline style attribute by using a 'data-progress' attribute and delegating width application to JavaScript. This satisfies the IDE's strict CSS validator.",
        "Status": "Completed"
    }
]

df = pd.DataFrame(data)

# File name
file_name = "BabbyTracker_Prompts_Log.xlsx"

try:
    # Save to Excel with optimized column widths
    writer = pd.ExcelWriter(file_name, engine='openpyxl')
    df.to_excel(writer, index=False, sheet_name='Prompts Log')
    
    # Auto-adjust columns for better readability
    worksheet = writer.sheets['Prompts Log']
    for idx, col in enumerate(df.columns):
        series = df[col]
        max_len = max((
            series.astype(str).map(len).max(),
            len(str(series.name))
        )) + 2
        worksheet.column_dimensions[chr(65 + idx)].width = min(max_len, 60) # Cap width at 60

    writer.close()
    print(f"Successfully created {file_name} with Matter column.")
except Exception as e:
    print(f"Error creating Excel: {e}")
    df.to_csv("BabbyTracker_Prompts_Log.csv", index=False)
    print("Fallback to CSV created.")
