import sys
import inspect
import json
import os
import nltk
import spacy
import textwrap
from nltk.corpus import wordnet as wn

nltk.download('wordnet')

nlp = spacy.load("en_core_web_md")

# Define the directory containing Python files
directory_path = ''

def get_related_words_wordnet(function_name):
    """Generate related words using WordNet."""
    synonyms = set()
    for syn in wn.synsets(function_name):
        for lemma in syn.lemmas():
            if lemma.name() != function_name and len(lemma.name()) > 2:
                synonyms.add(lemma.name().lower())
    return list(synonyms)

def get_related_words_spacy(function_name):
    """Generate related words using SpaCy."""
    token = nlp(function_name)
    related_words = set()

    threshold = 0.9

    for word in nlp.vocab:
        similarity = token.similarity(word)
        if similarity > threshold and word.is_alpha and word.text != function_name:
            related_words.add(word.text.lower())

    return list(related_words)

def split_function_name(function_name):
    """Generate different variations of the function name."""
    words = function_name.split('_')

    camel_case = ''.join([word.capitalize() for word in words])
    snake_case = function_name
    hyphen_case = '-'.join(words)
    spaced = ' '.join(words)

    variations = {
        "snake_case": snake_case,
        "camelCase": camel_case,
        "hyphen-case": hyphen_case,
        "spaced": spaced,
    }

    phrase_combinations = []
    for i in range(1, len(words) + 1):
        for j in range(i + 1, len(words) + 1):
            phrase_combinations.append(' '.join(words[i-1:j]))

    return variations, phrase_combinations

def get_function_details(func):
    """Retrieve details about the function including name, source, and input examples."""
    source_code = inspect.getsource(func)
    source_code = textwrap.dedent(source_code)

    operation_name = func.__name__
    related_words = get_related_words_wordnet(func.__name__)
    spacy_related_words = get_related_words_spacy(func.__name__)
    related_words.extend(spacy_related_words)

    relevant_related_words = [word for word in related_words if len(word) > 2]

    name_variations, phrase_combinations = split_function_name(func.__name__)

    input_examples = [
        func.__name__,
    ] + list(name_variations.values()) + relevant_related_words + phrase_combinations

    input_examples = list(set(input_examples))

    if len(func.__name__.split('_')) == 1:
        unique_input_examples = list(set(input_examples))
        unique_input_examples.extend(relevant_related_words)
        input_examples = list(set(unique_input_examples))

    return {
        "operation": operation_name,
        "function": source_code,
        "input_examples": input_examples
    }

def extract_functions_from_file(file_path):
    """Extract functions from a Python file."""
    dir_path = os.path.dirname(file_path)

    sys.path.append(dir_path)

    module_name = os.path.basename(file_path).replace('.py', '')

    module = __import__(module_name)

    functions = [getattr(module, func) for func in dir(module) if inspect.isfunction(getattr(module, func))]

    return functions

def parse_functions():
    """parse_functions function to parse all Python files and save the function details to a JSON file."""
    all_function_details = []

    # Iterate over all Python files in the specified directory
    for file_name in os.listdir(directory_path):
        if file_name.endswith('.py'):
            file_path = os.path.join(directory_path, file_name)
            functions = extract_functions_from_file(file_path)
            function_details = [get_function_details(func) for func in functions]
            all_function_details.extend(function_details)

    # Output file for JSON
    output_file = 'operations_data.json'

    # Save the details to a JSON file
    with open(output_file, 'w') as json_file:
        json.dump(all_function_details, json_file, indent=4)

if __name__ == "__main__":
    parse_functions()
