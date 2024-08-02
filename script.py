import os;
import numpy as np;
import pandas as pd;
import re;
from datetime import datetime
import json

transaction_data = pd.read_csv('data.csv', sep=',')
#converty all qty to positive numbers
transaction_data['Quantity'] = transaction_data['Quantity'].abs();
    
transaction_data.info()
print(transaction_data.to_string())

class Transaction:
  """
  A class to represent a financial transaction.
  """

  def __init__(self, symbol=None, ticker=None, type=None, premium=None, openDate=None, side=None, quantity=None, strike=None, expiration=None, assigned=False, closeDate=None, year=None):
    """
    Initializes a Transaction object.

    Args:
      ticker (str): The ticker symbol of the underlying security.
      type (str): The type of transaction (e.g., "buy", "sell").
      strike (float): The strike price of the option (if applicable).
      expiration (str): The expiration date of the option (if applicable).
      side (str): The side of the transaction (e.g., "long", "short").
      quantity (int): The quantity of the security traded.
      premium (float): The premium paid or received (if applicable).
      open_date (str): The date the transaction was opened.
      closed_date (str, optional): The date the transaction was closed (defaults to None).
    """
    self.symbol = symbol
    self.ticker = ticker
    self.type = type
    self.strike = strike
    self.expiration = expiration
    self.side = side
    self.quantity = quantity
    self.premium = premium
    self.openDate = openDate
    self.closeDate = closeDate
    self.year = year
    self.assigned = assigned

    def __dict__(self):
        return {
            "ticker": self.ticker,
            "type": self.type,
            "strike": self.strike,
            "expiration": self.expiration,
            "side": self.side,
            "quantity": self.quantity,
            "premium": self.premium,
            "openDate": self.openDate,
            "closeDate": self.closeDate,
            "year": self.year,
            "assigned": self.assigned
        }   

  def __str__(self):
    """
    Returns a string representation of the Transaction object.

    Returns:
      str: A human-readable string representation of the transaction details.
    """

    closed_date_str = self.closeDate if self.closeDate else None
    return f"Transaction(ticker='{self.ticker}', type='{self.type}', strike={self.strike}, expiration='{self.expiration}', side='{self.side}', quantity={self.quantity}, premium={self.premium}, openDate='{self.openDate}', closeDate='{closed_date_str}', symbol='{self.symbol}', assigned='{self.assigned}', year='{self.year}')"

  def to_json(self):
    if self.type in ('call', 'put'):
        if self.closeDate == None:
            return f'{{"ticker": "{self.ticker}", "type": "{self.type}", "strike": {self.strike}, "expiration": "{self.expiration}", "side": "{self.side}", "quantity": {self.quantity}, "premium": {self.premium}, "openDate": "{self.openDate}", "year": {self.year}", "assigned": {self.assigned}}}'
        else:
            return f'{{"ticker": "{self.ticker}", "type": "{self.type}", "strike": {self.strike}, "expiration": "{self.expiration}", "side": "{self.side}", "quantity": {self.quantity}, "premium": {self.premium}, "openDate": "{self.openDate}", "closeDate": "{self.closeDate}", "year": {self.year}", "assigned": {self.assigned}}}'
    if self.type == 'stock':
        return f'{{"ticker": "{self.ticker}", "type": "{self.type}", "side": "{self.side}", "quantity": {self.quantity}, "openDate": "{self.openDate}", "year": {self.year}", "assigned": {self.assigned}}}'
    if self.type == 'dividend':
        return f'{{"ticker": "{self.ticker}", "type": "{self.type}", "openDate": "{self.openDate}", "closeDate": "{self.closeDate}", "year": {self.year}", "assigned": {self.assigned}}}'

def dump_transactions_to_json(transactions):
  """
  Dumps a list of Transaction objects to a JSON array string.

  Args:
      transactions (list): A list of Transaction objects.

  Returns:
      str: A JSON string representing the array of transactions.
  """

  # Ensure transactions is a list
  if not isinstance(transactions, list):
    raise TypeError("Input must be a list of Transaction objects")

  # Use a loop to call __dict__ on each transaction
  transaction_dicts = []
  for transaction in transactions:
    transaction_dicts.append(transaction.__dict__)

  # Dump the list of dictionaries to a JSON array string
  json_array = json.dumps(transaction_dicts, indent=4)  # Add indentation for readability

  return json_array

def extract_values(text):
  """
  Extracts values from the given string format without using regular expressions.

  Args:
      text (str): The string to parse.

  Returns:
      dict: A dictionary containing extracted values (ticker, month, day, year, strike, option_type).
  """
  parts = text.split()  # Split the string into a list of words

#  if len(parts) != 7:  # Check if expected number of parts exists
#    return {}  # Return empty dictionary if format is invalid

  ticker = parts[0]
  month = parts[1]
  day = parts[2]

  # Handle optional year
  if parts[3][0] == "'":  # Check if year starts with a single quote
    year = parts[3][1:3]  # Extract year without quotes
    remaining_parts = parts[4:]
  else:
    year = None
    remaining_parts = parts[3:]

  # Extract strike price and option type from remaining parts
  try:
    strike = float(remaining_parts[0][1:])  # Remove leading '$' from strike
    option_type = remaining_parts[1]
  except (IndexError, ValueError):
    return {}  # Return empty dictionary if parsing fails

  return {
      "ticker": ticker,
      "month": month,
      "day": int(day),  # Convert day to integer
      "year": year,
      "strike": strike,
      "option_type": option_type,
  }



def transform_date(date_string):
  """
  Transforms a date string in the format "MM/DD/YY" to an ISO 8601 format string with time and UTC offset.

  Args:
      date_string (str): The date string in the format "MM/DD/YY" to transform.

  Returns:
      str: The transformed date string in ISO 8601 format (YYYY-MM-DD'T'HH:MM:SS.SSS'Z').
  """

  # Define the format string for parsing the original date
  original_format = "%m/%d/%y"

  # Parse the date string using datetime.strptime
  parsed_date = datetime.strptime(date_string, original_format)

  # Assume default time (can be modified as needed)
  #default_time = "00:00:00"  # Example: set default time to 4:00 AM

  # Combine date and time parts
  formatted_datetime = parsed_date.strftime("%Y-%m-%d")# + "T" + default_time

  # Add milliseconds (can be modified or omitted)
  #formatted_datetime += ".000Z"

  return formatted_datetime

def extract_full_year(timestamp_string):
  """Extracts the full year from an ISO 8601 timestamp string.

  Args:
    timestamp_string: The timestamp string to process.

  Returns:
    The full year as an integer.
  """

  datetime_obj = datetime.fromisoformat(timestamp_string)
  return datetime_obj.year


month_map = {
  "Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "May": 5, "Jun": 6,
  "Jul": 7, "Aug": 8, "Sep": 9, "Oct": 10, "Nov": 11, "Dec": 12
}

#collect closing transactions
closing_transactions = [];

for index, row in transaction_data.iterrows():
    if row['TransactionType'].strip() in ('Bought To Cover', 'Option Expiration', 'Sold To Close', 'Option Assignment'):
        closing_transaction = Transaction(
            symbol=row['Symbol'],
            quantity=row['Quantity'],
            closeDate=row['TransactionDate'],
            premium=row['Amount']);
        if row['TransactionType'] == 'Option Assignment':
            closing_transaction.assigned = True;
        print(closing_transaction);    
        closing_transactions.append(closing_transaction);

print("found {0} closing transactions:".format(len(closing_transactions)));
#reverse array!!!!
closing_transactions.reverse();

final_transactions = [];

for index, row in transaction_data.iterrows():
    # option transactions - sell to open
    if row['TransactionType'] == 'Sold Short':
        #print('added transaction: ' + row['Symbol']);

        extracted_values = extract_values(row['Symbol'])
        #if extracted_values:
        #  print("Extracted Values:")
        #  for key, value in extracted_values.items():
        #    print(f"{key}: {value}")
        #else:
        #  print("Error: String does not match the expected format.")
        if extracted_values:
            transaction = Transaction(
                ticker=extracted_values["ticker"],
                side="sell-to-open",
                strike=extracted_values['strike'],
                expiration="{0}/{1}/{2}".format(month_map.get(extracted_values['month']), extracted_values['day'], extracted_values['year']),
                type=extracted_values['option_type'].lower(),
                quantity=row['Quantity'],
                premium=row['Amount'],
                openDate=row['TransactionDate'],
                symbol=row['Symbol']
            )

            #print(transaction)
            final_transactions.append(transaction);
    # option transactions - buy to open
    if row['TransactionType'] == 'Bought To Open':
        #print('added transaction: ' + row['Symbol']);

        extracted_values = extract_values(row['Symbol'])
        #if extracted_values:
        #  print("Extracted Values:")
        #  for key, value in extracted_values.items():
        #    print(f"{key}: {value}")
        #else:
        #  print("Error: String does not match the expected format.")
        if extracted_values:
            transaction = Transaction(
                ticker=extracted_values["ticker"],
                side="buy-to-open",
                strike=extracted_values['strike'],
                expiration="{0}/{1}/{2}".format(month_map.get(extracted_values['month']), extracted_values['day'], extracted_values['year']),
                type=extracted_values['option_type'].lower(),
                quantity=row['Quantity'],
                premium=row['Amount'],
                openDate=row['TransactionDate'],
                symbol=row['Symbol']
            )

            #print(transaction)
            final_transactions.append(transaction);
     #stocks transactions
    if row['TransactionType'] == 'Bought':
        transaction = Transaction(
                ticker=row['Symbol'],
                side="buy",
                type="stock",
                quantity=row['Quantity'],
                premium=row['Amount'],
                openDate=row['TransactionDate'],
                symbol=row['Symbol']
            )
        #print(transaction)
        final_transactions.append(transaction);
    if row['TransactionType'] == 'Sold':
        transaction = Transaction(
                ticker=row['Symbol'],
                side="sell",
                type="stock",
                quantity=row['Quantity'],
                premium=row['Amount'],
                openDate=row['TransactionDate'],
                symbol=row['Symbol']
            )
        #print(transaction)
        final_transactions.append(transaction);
    if row['TransactionType'] == 'Dividend':
        transaction = Transaction(
                ticker=row['Symbol'],
                type="dividend",
                premium=row['Amount'],
                openDate=row['TransactionDate'],
                closeDate=row['TransactionDate'],
                symbol=row['Symbol']
            )
        #print(transaction);
        final_transactions.append(transaction);        

# find closing transactions
for transaction in final_transactions:
    # search only for option transactions
    if transaction.type == 'call' or transaction.type == 'put':
        # get qty of transaction to close
        original_qty = transaction.quantity;
        #print("looking for: {0}".format(transaction));
        for i in range(4):
            if original_qty < 1:
               break;
            for closing_transaction in closing_transactions:           
                if transaction.symbol == closing_transaction.symbol and closing_transaction.quantity > 0:
                    #print("found {0} with Qty = {1}, closeDate = {2}".format(closing_transaction.symbol, closing_transaction.quantity, closing_transaction.closeDate));
                    
                    closing_qty = closing_transaction.quantity;
                    if original_qty < closing_qty:
                        closing_premium_to_take = original_qty * closing_transaction.premium / closing_qty;
                        transaction.premium = transaction.premium + closing_premium_to_take;
                        # update closing transaction qty
                        closing_transaction.quantity = closing_qty - original_qty;
                        closing_transaction.premium = closing_transaction.premium - closing_premium_to_take;
                        original_qty = 0
                    elif original_qty >= closing_qty:
                        transaction.premium = transaction.premium + closing_transaction.premium;
                        closing_transaction.quantity = 0;
                        # update original transaction qty to close
                        original_qty = original_qty - closing_qty;
                    transaction.closeDate = closing_transaction.closeDate;
                    transaction.assigned = closing_transaction.assigned
    
        if original_qty > 0:
            print("closing transaction is not found for {0}".format(transaction.symbol));
            transaction.closeDate = None;
        
# transform dates
for transaction in final_transactions:
    transaction.openDate =  transform_date(transaction.openDate)
    transaction.year = extract_full_year(transaction.openDate)
    if transaction.expiration != None:
        transaction.expiration = transform_date(transaction.expiration)
    if transaction.closeDate != None:
        transaction.closeDate = transform_date(transaction.closeDate)

#print all transactions and calculate premium sum
premium_sum = 0;
for transaction in final_transactions:
    premium_sum = premium_sum + transaction.premium;
    print(transaction.to_json())

print("FINAL PREMIUM: {0}".format(premium_sum));

clean_transactions = [
    {key: value for key, value in transaction.__dict__.items() if key != "symbol"}
    for transaction in final_transactions
]
#print(clean_transactions);

json_array = json.dumps(clean_transactions, indent=4)
#print(json_array)
#json_string = dump_transactions_to_json(clean_transactions)
#print(json_string)
#json_array = []
#for transaction in final_transactions:
#    json_array.append(json.dumps(transaction.__dict__))
#print(json_array)

def save_json_string_to_file(json_string, file_path):
  """Saves a JSON string to a file.

  Args:
    json_string: The JSON string to be saved.
    file_path: The path to the output file.
  """

  with open(file_path, 'w') as f:
    json.dump(json.loads(json_string), f, indent=4)

file_path = "data.json"
save_json_string_to_file(json_array, file_path)




