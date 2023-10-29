const axios = require('axios');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');
const fs = require('fs');
const json2csv = require('json2csv').Parser;

// Define the keyword
const keyword = 'natural language processing';

// Initialize the News API parameters
const apiKey = 'd5a53461ac3e43ea9cb01f4fa9824420';
const apiUrl = 'https://newsapi.org/v2/everything';

// Create an array to store the extracted article data
const allArticleData = [];

// Function to fetch articles for a keyword and add them to the array
async function fetchArticlesForKeyword(keyword) {
  try {
    // Build the URL for the keyword
    const url = `${apiUrl}?q=${keyword}&exclude_domains="arxiv.org"&language=en&sortBy=publishedAt&apiKey=${apiKey}`;

    // Make an HTTP request to get search results
    const r1 = await axios.get(url);

    // Extract all search results for the keyword
    const searchResults = r1.data.articles;

    // Loop through the search results and fetch and save all articles
    for (const result of searchResults) {
      try {
        // Make a request to fetch the article's HTML content
        const r2 = await axios.get(result.url);

        // Convert the HTML to a DOM object using JSDOM
        const dom = new JSDOM(r2.data, { url: result.url });

        // Parse the article content using Readability
        const article = new Readability(dom.window.document).parse();

        // Define a variable to store the extracted article data
        const articleData = {
          keyword,
          url: result.url,
          title: article.title,
          content: article.textContent,
          urlToImage: result.urlToImage, // Include image URL
          author: result.author,
        };

        // Add the data to the array
        allArticleData.push(articleData);

        console.log(`Data for keyword "${keyword}" saved to the array`);
      } catch (error) {
        console.error(`Error fetching an article: ${error.message}`);
      }
    }
  } catch (error) {
    console.error(`Error fetching articles for keyword ${keyword}: ${error.message}`);
  }
}

// Fetch articles for the specified keyword and add them to the array
async function fetchAndStoreArticles() {
  await fetchArticlesForKeyword(keyword);

  // Save all the data to a JSON file
  const jsonFilename = 'nlp_articles.json';
  fs.writeFileSync(jsonFilename, JSON.stringify(allArticleData, null, 2));
  console.log(`All data saved to ${jsonFilename}`);

  // Convert the JSON data to CSV
  const fields = ['keyword', 'url', 'title', 'content', 'urlToImage', 'author'];
  const json2csvParser = new json2csv({ fields });
  const csv = json2csvParser.parse(allArticleData);
  const csvFilename = 'nlp_articles.csv';
  fs.writeFileSync(csvFilename, csv);
  console.log(`Data converted to CSV and saved as ${csvFilename}`);
}

// Start fetching articles for the specified keyword and converting to CSV
fetchAndStoreArticles();
