const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const { mongoose, Movie } = require('./connmovie'); 
const visitedUrls = new Set();

async function getMovieUrls(genreUrl) {
  try {
    const response = await axios.get(genreUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    const $ = cheerio.load(response.data);

    
    const movieUrls = $('a.ipc-title-link-wrapper').map((index, element) => $(element).attr('href')).get();
    return movieUrls.map(url => `https://www.imdb.com${url}`);
  } catch (error) {
    console.error('Error fetching movie URLs:', error.message);
    return [];
  }
}


function extractPlatformName(url) {
  const knownPlatforms = [
    { pattern: /netflix/, name: 'Netflix' },
    { pattern: /primevideo/, name: 'Prime Video' },
    { pattern: /hotstar/, name: 'Hotstar' }
  ];

  for (const platform of knownPlatforms) {
    if (platform.pattern.test(url)) {
      return platform.name;
    }
  }

  const parts = url.split('.');
  if (parts.length >= 2) {
    return parts[parts.length - 2];
  }

  return null;
}


async function scrapeAndSaveMovieData(url) {
  try {
    if (visitedUrls.has(url)) {
      console.log('Skipping duplicate:', url);
      return;
    }

    visitedUrls.add(url);

    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    try {
      const pageLoadPromise = page.goto(url, { waitUntil: 'domcontentloaded' });
      await Promise.race([pageLoadPromise, new Promise(resolve => setTimeout(resolve, 10000))]); 

      await page.waitForSelector('video.jw-video');

      const content = await page.content();
      const $ = cheerio.load(content);

      const trailerUrl = $('video.jw-video').attr('src');
      const posterUrl = $('meta[property="og:image"]').attr('content');
      const streamingPlatforms = [];
      const rentBuyPlatforms = [];

      $('div[data-testid="tm-box-woc-text"]').each((index, element) => {
        const platform = $(element).text().trim();
        if (platform === 'STREAMING') {
          streamingPlatforms.push($(element).next().find('a').attr('href'));
        } else if (platform === 'RENT/BUY') {
          rentBuyPlatforms.push($(element).next().find('a').attr('href'));
        }
      });

      const platforms = streamingPlatforms.concat(rentBuyPlatforms);
      const platformNames = platforms.map(extractPlatformName).filter(Boolean);

      const newMovie = new Movie({
        title: $('h1').text().trim(),
        rating: $('div[data-testid="hero-rating-bar__aggregate-rating__score"]').text().trim().split('/')[0],
        summary: $('span[data-testid="plot-xs_to_m"]').text().trim(),
        runtime: $('li.ipc-inline-list__item:contains("h")').text().trim().match(/(\d+h\s*\d+m)/)?.[0] || '',
        language: $('li[data-testid="title-details-languages"] .ipc-metadata-list-item__list-content-item--link').map((index, element) => $(element).text().trim()).get().join(' '),
        genres: $('div[data-testid="genres"] a').map((index, element) => $(element).text().trim()).get().join(' , '),
        completeUrl: `https://www.imdb.com${$('a.ipc-lockup-overlay').attr('href')}`,
        posterUrl,
        trailerUrl,
        platforms: platformNames,
      });

      const savedMovie = await newMovie.save();
      console.log('Movie saved to database:', savedMovie);
    } catch (timeoutError) {
      console.error('Timeout error:', timeoutError.message);
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error('Error scraping IMDb:', error.message);
  }
}


async function scrapeAndSaveMoviesForGenre(genreUrl) {
  const movieUrls = await getMovieUrls(genreUrl);

  for (const movieUrl of movieUrls) {
    await scrapeAndSaveMovieData(movieUrl);
  }
}

async function scrapeAndSaveAllMovies() {
  const everythingUrls = [
    'https://www.imdb.com/search/title/?title_type=feature&genres=action&groups=top_100',
    'https://www.imdb.com/search/title/?title_type=feature&genres=animation&sort=moviemeter,asc',
    'https://www.imdb.com/search/title/?title_type=feature&genres=sci-fi',
    'https://www.imdb.com/search/title/?title_type=feature&genres=action,thriller&countries=IN',
    'https://www.imdb.com/search/title/?title_type=feature&genres=romance',
  ];

  for (const genreUrl of everythingUrls) {
    await scrapeAndSaveMoviesForGenre(genreUrl);
  }

  mongoose.connection.close();
}

scrapeAndSaveAllMovies();
