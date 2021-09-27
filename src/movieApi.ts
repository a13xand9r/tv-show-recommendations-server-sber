// import axios from 'axios'
import { RecommendationsList } from './types'
import MovieDB from 'node-themoviedb'

// const axiosMovie = axios.create({
//   baseURL: 'https://api.themoviedb.org/3/',
// });

const mdb = new MovieDB('fb56ccc42db8618ed5a9adcb30677b5c', {language: 'ru'});

export const recommendTVShow = async (query: string) => {
  try{
    const foundTVShows = await mdb.search.TVShows({
      query: {
        query
      }
    })
    console.log(foundTVShows.data)
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