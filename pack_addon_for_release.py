import json
import os
import shutil
import zipfile
from pathlib import Path


def load_version_from_manifest():
    """Load version from manifest.json"""
    try:
        with open('manifest.json', 'r', encoding='utf-8') as f:
            manifest = json.load(f)
            return manifest.get('version', '1.0.0')
    except FileNotFoundError:
        print("Error: manifest.json not found")
        exit(1)
    except json.JSONDecodeError:
        print("Error: Invalid JSON in manifest.json")
        exit(1)


def create_zip_archive(zip_path):
    """Create zip archive with addon files"""
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Add files
        if os.path.exists('manifest.json'):
            zipf.write('manifest.json')
        if os.path.exists('readme.md'):
            zipf.write('readme.md')
        
        # Add directories
        folders = ['sites', 'styles', 'scripts', 'icons', 'data', 'background']
        for folder in folders:
            if os.path.exists(folder):
                for root, dirs, files in os.walk(folder):
                    for file in files:
                        file_path = os.path.join(root, file)
                        zipf.write(file_path)


def handle_existing_file(zip_path):
    """Handle existing zip file"""
    while True:
        response = input(f"\nFile '{os.path.basename(zip_path)}' already exists.\n"
                        "[Y] Overwrite, [R] Rename, [N] Abort? ").strip().upper()
        
        if response == 'Y':
            os.remove(zip_path)
            return zip_path
        elif response == 'R':
            base_name = os.path.basename(zip_path)
            name, ext = os.path.splitext(base_name)
            counter = 1
            new_name = f"{name}_{counter}{ext}"
            new_path = os.path.join(os.path.dirname(zip_path), new_name)
            
            while os.path.exists(new_path):
                counter += 1
                new_name = f"{name}_{counter}{ext}"
                new_path = os.path.join(os.path.dirname(zip_path), new_name)
            
            print(f"Will save as: {new_name}")
            return new_path
        elif response == 'N':
            print("Aborted")
            exit(0)
        else:
            print("Invalid input. Please enter Y, R, or N")


def main():
    # Load version
    version = load_version_from_manifest()
    print(f"Loaded version: {version}")
    
    # Create releases folder if it doesn't exist
    releases_dir = 'releases'
    os.makedirs(releases_dir, exist_ok=True)
    
    # Define zip file path
    zip_filename = f"Medicus Assistant {version}.zip"
    zip_path = os.path.join(releases_dir, zip_filename)
    
    # Check if file exists
    if os.path.exists(zip_path):
        zip_path = handle_existing_file(zip_path)
    
    # Create zip archive
    print(f"Creating archive: {zip_filename}")
    create_zip_archive(zip_path)
    print(f"Successfully created: {zip_path}")


if __name__ == '__main__':
    main()
