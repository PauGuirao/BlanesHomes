import pandas as pd
import os

def add_property_attributes():
    # Define the input and output paths
    input_path = '../data/scrappedFiles/blanes_scrapped.csv'
    
    # Read the CSV file
    df = pd.read_csv(input_path)
    
    # Define new attributes with default values
    new_attributes = {
        'baños': 0,
        'año_construcción': 0,
        'terraza': False,
        'balcón': False,
        'garaje': False,
        'ascensor': False,
        'reforma': False
    }
    
    # Add new columns with default values if they don't exist
    for column, default_value in new_attributes.items():
        if column not in df.columns:
            df[column] = default_value
    
    # Save the updated DataFrame back to CSV
    df.to_csv(input_path, index=False)
    print(f"Added new columns to {input_path}")

if __name__ == "__main__":
    add_property_attributes()