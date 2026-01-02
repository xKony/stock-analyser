import subprocess
import sys
import os

def test_main_execution():
    """
    Runs the main.py script with the --test flag to process a random subreddit.
    """
    print("Running main.py --test ...")
    
    # Ensure we are running from the project root
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    main_script = os.path.join(project_root, "main.py")
    
    try:
        result = subprocess.run(
            [sys.executable, main_script, "--test"],
            cwd=project_root,
            check=True,
            capture_output=False # Let output stream to console
        )
        print("\nTest execution completed successfully.")
    except subprocess.CalledProcessError as e:
        print(f"\nTest execution failed with exit code {e.returncode}.")
        sys.exit(e.returncode)

if __name__ == "__main__":
    test_main_execution()
