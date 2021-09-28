// import axios from 'axios'
import { RecommendationsList } from './types'
import MovieDB from 'node-themoviedb'
require('dotenv').config()

// const axiosMovie = axios.create({
//   baseURL: 'https://api.themoviedb.org/3/',
// });

const mdb = new MovieDB(process.env.MOVIE_API_KEY as string, {language: 'ru'});

export const findTVShow = async (query: string) => {
  try{
    const foundTVShows = await mdb.search.TVShows({
      query: {
        query
      }
    })
    console.log('foundTVShows', foundTVShows.data.results[0])
    if (foundTVShows.data.results.length > 0){
      return foundTVShows.data
    }
  } catch(e){
    console.log('movie Request error', e)
  }
  return null
}

export const recommendTVShows = async (TVShowId: number) => {
  try {
    const res = await mdb.tv.getRecommendations({
      pathParameters: {
        tv_id: TVShowId
      }
    })
    return res.data
  } catch (e) {
    console.log('movie Request error', e)
  }
  return null
}

export const getGenres = async () => {
  try {
    const genres = await mdb.genre.getTVList()
    return genres.data
  } catch (error) {
    console.log('genreError', error)
    return null
  }
}