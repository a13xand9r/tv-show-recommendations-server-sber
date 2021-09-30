import MovieDB from 'node-themoviedb';
import { recommendTVShows } from '../movieApi';
import { pluralization, tvShowName } from './fixTextObjects';

export function getRandomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(arr.length * Math.random())]
}

const changeText = <T extends object>(text: string, changeObj: T) => {
  let newText: string = text
  const keys = Object.keys(changeObj)
  keys.forEach((key) => {
    if (text.toLowerCase().includes(key.toLowerCase())) {
      //@ts-ignore
      newText = text.replace(key, changeObj[key])
      //@ts-ignore
      newText = newText.replace(key.toLowerCase(), changeObj[key].toLowerCase())
    }
  })
  return newText
}

export const fixPluralization = (text: string) => {
  return changeText(text, pluralization)
}
export const fixTVShowName = (text: string) => {
  return changeText(text, tvShowName)
}

export const findFirstTVShowWithRecommendation = async (
  foundTVShows: MovieDB.Responses.Search.TVShows,
  foundTVShowsIndex: number | undefined
) => {
  let recommendations: MovieDB.Responses.TV.GetRecommendations | null = {
    page: 1,
    total_pages: 1,
    total_results: 0,
    results: []
  }
  let foundTVShowsIndexFirst = foundTVShowsIndex
  for (let i = foundTVShowsIndex ?? 0; i < foundTVShows.results.length; i++) {
    recommendations = await recommendTVShows(foundTVShows?.results[i].id)
    foundTVShowsIndexFirst = i
    console.log('new recommendation fetch')
    if (recommendations?.total_pages) break
  }
  return {recommendations, foundTVShowsIndexFirst}
}