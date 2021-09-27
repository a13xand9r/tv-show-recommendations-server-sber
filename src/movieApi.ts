// import axios from 'axios'
import { RecommendationsList } from './types'
import MovieDB from 'node-themoviedb'
require('dotenv').config()

// const axiosMovie = axios.create({
//   baseURL: 'https://api.themoviedb.org/3/',
// });

const mdb = new MovieDB(process.env.MOVIE_API_KEY as string, {language: 'ru'});

export const recommendTVShow = async (query: string) => {
  try{
    const foundTVShows = await mdb.search.TVShows({
      query: {
        query
      }
    })
    if (foundTVShows.data.results.length > 0){
      const TVShowId = foundTVShows.data.results[0].id
      const res = await mdb.tv.getRecommendations({
        pathParameters: {
          tv_id: TVShowId
        }
      })
      return res.data
    }
  } catch(e){
    console.log('movie Request error', e)
  }
  return null
}