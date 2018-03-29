import nltk
import pandas as pd
import re
import html
import json
import math
import numpy as np
import operator
import scipy

# Reading in csv files for tweet-dataset and mft-dictionary with pandas
tweets_csv = pd.read_csv('filepath_to_tweet_dataset', header=0, usecols=['text', 'isRetweet', 'positveSentimentScore', 'negativeSentimentScore', 'party'])
words_csv = pd.read_csv('filepath_to_mft_dataset', header=0)

# German stopword corpus from NLTK
german_stopwords = set(nltk.corpus.stopwords.words('german'))

# Cleaning tweets according to the rules defined by Kaur et al.
cleaned_tweets = []

for tweet in tweets_csv['text']:
    tweet = html.unescape(tweet) # remove html entities
    tweet = re.sub(r'https?:\/\/.*[\r\n]*', '', tweet) # remove links and URLs
    tweet = re.sub(r'@.+', '', tweet) # remove screennames (e.g. @HeikoMaas)
    tweet = re.sub('[^A-ZÄÖÜa-zäöüß0-9\s]+', '', tweet) # remove special characters (e.g. ! and §)
    tweet = re.sub('([0-9]+\s)', '', tweet) # remove numbers with following whitespace
    tweet = re.sub('([0-9]+)', '', tweet) # remove numbers
    tweet = re.sub(r'\b\w{1,3}\b', '', tweet) # remove words with a length less than 3
    tweet = re.sub(r'#', '', tweet) # remove hashtag symbols
    tweet = re.sub(r'\s{2,}', ' ', tweet) # remove two or more combined whitespaces
    tweet = tweet.strip() # remove trailing and leading whitespaces
    tweet = tweet.lower() # transform tweet to lowercase
    tweet = ' '.join([w for w in tweet.split() if w not in german_stopwords]) # remove german stopwords
    cleaned_tweets.append(tweet)


# Transform MFT-words to regexes
regex_words = []

for word in words_csv['word']:
    word = re.sub(r'\*', '.*', word)
    word = re.sub(r'ae', 'ä', word)
    word = re.sub(r'oe', 'ö', word)
    word = re.sub(r'(?<!q)ue', 'ü', word)
    regex_words.append(word)


# Reading in selected cleaned tweets and all words from those tweets
selected_clean_tweets = pd.read_csv('filepath_to_tweet_dataset', header=0, skiprows=lambda x: (x % 10 != 0))
with open('all_selected_tweet_words.txt', 'r') as fp:
    all_selected_tweet_words = json.load(fp)

# Creating the word-tweet-matrix
word_tweet_matrix = {}

for word in all_selected_tweet_words:
    word_tweet_matrix[word] = []
    for tweet in selected_clean_tweets['cleanedTweet']:
        word_tweet_matrix[word].append(len(re.findall(r'{0}'.format(word), str(tweet))))


# Transforming the word-tweet-matrix to a weighted word-tweet-matrix according to the formula given by Kaur et al.
weighted_word_tweet_matrix = {}
no_of_tweets = len(selected_clean_tweets['text'])

for word in list(word_tweet_matrix.keys()):
    apps = np.count_nonzero(word_tweet_matrix[word])
    log_no_tweets = math.log(no_of_tweets + 1)
    log_no_apps = math.log(apps)
    logs_diff = log_no_tweets - log_no_apps
    weighted_word_tweet_matrix[word] = list(map(lambda x: x * logs_diff, word_tweet_matrix[word]))


# Creating the overlap-score-matrix by summing up rows from the weighted word-tweet-matrix
scored_matrix = {}

for word in weighted_word_tweet_matrix:
    scored_matrix[word] = sum(weighted_word_tweet_matrix[word])


# Sorting the scored matrix in descending order
sorted_score_matrix = sorted(scored_matrix.items(), key=operator.itemgetter(1), reverse=True)


# Creating keywords and contextwords
result_keywords = sorted_score_matrix[:2000]
result_contextwords = sorted_score_matrix[:20000]


# Creating the keyword-contextword-matrix by counting the co-occurrences
c_matrix = []

def count_co_occs(word1, word2):
    return_sum = 0
    r_word1 = r'{0}'.format(word1)
    r_word2 = r'{0}'.format(word2)
    for tweet in selected_clean_tweets['cleanedTweet']:
        str_key = str(tweet)
        str_key = str_key.split()
        if (r_word1 in str_key) and (r_word2 in str_key):
            return_sum += 1
    return return_sum

for kword in result_keywords:
    c_matrix.append([])
    for cword in result_contextwords:
        c_matrix[result_keywords.index(kword)].append(count_co_occs(kword[0], cword[0]))


# Creating the U-matrix by using SVD (single value decomposition) on the c-matrix
u, s, vh = np.linalg.svd(c_matrix, full_matrices=True)
u_list = u.tolist()


# Creating the vectors for the keywords by taking the top 100 dimensions of every word in the U-matrix
vector_keyword_matrix = []

for lis in u_list:
    vector_keyword_matrix.append(lis[:100])


# Adding the keywords as keys to their respective vectors
vector_keyword_matrix_with_words = {}

for word in result_keywords:
    vector_keyword_matrix_with_words[word[0]] = vector_keyword_matrix[result_keywords.index(word)]


# Creating the vectors for the selected tweets by adding up the vectors of the keywords the tweet contains
cleaned_tweet_vectors = []

for tweet in selected_clean_tweets['cleanedTweet']:
    curr_vectors_arr = []
    for word in str(tweet).split():
        if word in list(vector_keyword_matrix_with_words.keys()):
            curr_vectors_arr.append(vector_keyword_matrix_with_words[word])
    cleaned_tweet_vectors.append([sum(x) for x in zip(*curr_vectors_arr)])



# Creating the word-tweet-matrix for the MFT-words
mft_word_tweet_matrix = {}

for word in regex_words:
    mft_word_tweet_matrix[word] = []
    for tweet in selected_clean_tweets['cleanedTweet']:
        mft_word_tweet_matrix[word].append(len(re.findall(r'{0}'.format(word), str(tweet))))


# Transforming the mft-word-tweet-matrix to a weighted mft-word-tweet-matrix according to the formula given by Kaur et al.
weighted_mft_word_tweet_matrix = {}
no_of_tweets = len(selected_clean_tweets['text'])

for word in list(mft_word_tweet_matrix.keys()):
    apps = np.count_nonzero(mft_word_tweet_matrix[word])
    log_no_tweets = math.log(no_of_tweets + 1)
    log_no_apps = 0 if apps is 0 else math.log(apps)
    logs_diff = log_no_tweets - log_no_apps
    weighted_mft_word_tweet_matrix[word] = list(map(lambda x: x * logs_diff, mft_word_tweet_matrix[word]))


# Creating the mft-overlap-score-matrix by summing up rows from the weighted mft-word-tweet-matrix
scored_mft_matrix = {}

for word in weighted_mft_word_tweet_matrix:
    scored_mft_matrix[word] = sum(weighted_mft_word_tweet_matrix[word])


# Sorting the scored mft-matrix in descending order
sorted_mft_score_matrix = sorted(scored_mft_matrix.items(), key=operator.itemgetter(1), reverse=True)


# Creating the mftword-contextword-matrix for the by counting the co-occurrences
mft_c_matrix = {}

def count_co_occs(word1, word2):
    return_sum = 0
    r_word1 = r'{0}'.format(word1)
    r_word2 = r'{0}'.format(word2)
    for tweet in selected_clean_tweets['cleanedTweet'][:1]:
        str_key = str(tweet)
        if re.search(r_word1, str_key) and re.search(r_word2, str_key):
            return_sum += 1
    return return_sum

for kword in scored_mft_matrix:
    mft_c_matrix[kword] = []
    for cword in result_contextwords:
        mft_c_matrix[kword].append(count_co_occs(kword, cword[0]))


# Creating the U-matrix by using SVD (single value decomposition) on the mft-c-matrix
u, s, vh = np.linalg.svd(mft_c_matrix, full_matrices=True)
u_list = u.tolist()


# Creating the vectors for the mft-words by taking the top 100 dimensions of every word in the U-matrix
vector_mft_matrix = []

for lis in u_list:
    vector_mft_matrix.append(lis[:100])


# Creating the vectors for the 11 MFT-Categories by adding up the vectors of their corresponding words
german_mft_categories = ["Schutz", "Schaden", "Gerechtigkeit", "Ungerechtigkeit", "Zugehörigkeit", "Ausgrenzung", "Gehorsamkeit", "Protest", "Tugendhaftigkeit", "Verdorbenheit", "Moral Allgemein"]
german_mft_categories_nums = [0, 15, 50, 76, 94, 119, 143, 180, 208, 233, 264, len(vector_mft_matrix)-1]

vector_mft_category_matrix = {}

for i, cat in enumerate(german_mft_categories):
    vector_mft_category_matrix[cat] = [sum(x) for x in zip(*vector_mft_matrix[german_mft_categories_nums[i]:german_mft_categories_nums[i+1]])]


# Creating a list with the similarities a tweet has with each MFT-Category by comparing their respective vectors via cosine-similarity
tweet_mft_similarities = []

for vector in cleaned_tweet_vectors:
    curr_sims = []
    if len(vector) is not 0:
        for cat in german_mft_categories:
            curr_sim = 1 - scipy.spatial.distance.cosine(vector, vector_mft_category_matrix[cat])
            curr_sim = 0 if np.isnan(curr_sim) else curr_sim
            curr_sims.append((cat, curr_sim))
    tweet_mft_similarities.append(curr_sims)


# Counting the number of tweets categorized to each category
categories_count = []

for arry in tweet_mft_similarities:
    if arry != []:
        categories_count.append(sorted(arry, key=lambda tup: tup[1], reverse=True)[0][0])

tweets_per_category = {}

for cat in german_mft_categories:
    tweets_per_category[cat] = categories_count.count(cat)


