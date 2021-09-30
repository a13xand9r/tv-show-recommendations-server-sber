import { Card, SaluteRequest, SaluteResponse } from '@salutejs/scenario'
import MovieDB from 'node-themoviedb'
import { getGenres, recommendTVShows } from '../movieApi'
import { fixTVShowName, getRandomFromArray } from './utils'

export const findGenres = (genres: MovieDB.Responses.Genre.Common, genreIds: number[]) => {
  return genres.genres.filter(genre => {
    let flag = false
    genreIds.forEach(id => {
      if (id === genre.id) flag = true
    })
    return flag
  }).map(genre => genre.name)
}

export const sendNewTVShow = async (
  req: SaluteRequest,
  res: SaluteResponse,
  movie: MovieDB.Objects.TVShow,
  genres: MovieDB.Responses.Genre.Common,
  initialPhrase: string = ''
) => {
  if (initialPhrase){
    res.appendSuggestions(['Найти другой сериал', 'Ещё', 'Не тот сериал'])
  } else{
    res.appendSuggestions(['Найти другой сериал', 'Ещё', 'Сколько всего рекомендаций?'])
  }
  let recommendationText: string[] = []
  if (req.request.payload.character.appeal === 'official') {
    recommendationText = ['Рекомендую', 'Могу порекомендовать', 'Можете посмотреть']
    res.setPronounceText(`${initialPhrase}${getRandomFromArray(recommendationText)} ${fixTVShowName(movie.name)}. ${movie.overview}. Скажите \"ещё\", чтобы посмотреть другую рекомендацию.`)
  } else {
    recommendationText = ['Рекомендую', 'Могу порекомендовать', 'Можешь посмотреть']
    res.setPronounceText(`${initialPhrase}${getRandomFromArray(recommendationText)} ${fixTVShowName(movie.name)}. ${movie.overview}. Скажи \"ещё\", чтобы посмотреть другую рекомендацию.`)
  }
  const movieGenres = findGenres(genres, movie.genre_ids)
  res.appendCommand({
    type: 'SET_TV_SHOW',
    tvShow: {
      name: fixTVShowName(movie.name),
      img: `https://www.themoviedb.org/t/p/w600_and_h900_bestv2/${movie.poster_path}`,
      description: movie.overview,
      year: new Date(movie.first_air_date).getFullYear(),
      rate: movie.vote_average,
      genres: movieGenres
    }
  })
}
export const sendFoundTVShow = async (
  req: SaluteRequest,
  res: SaluteResponse,
  movie: MovieDB.Objects.TVShow,
  genres: MovieDB.Responses.Genre.Common
) => {
  res.appendSuggestions(['Да', 'Нет'])
  if (req.request.payload.character.appeal === 'official') {
    res.setPronounceText(`Вы имели ввиду сериал ${movie.name}?`)
  } else {
    res.setPronounceText(`Ты имел ввиду сериал ${movie.name}?`)
  }
  const movieGenres = findGenres(genres, movie.genre_ids)
  res.appendCommand({
    type: 'SET_TV_SHOW',
    tvShow: {
      name: movie.name,
      img: `https://www.themoviedb.org/t/p/w600_and_h900_bestv2/${movie.poster_path}`,
      description: movie.overview,
      year: new Date(movie.first_air_date).getFullYear(),
      rate: movie.vote_average,
      genres: movieGenres
    }
  })
}

export const createMovieCard = (movie: MovieDB.Objects.TVShow): Card => ({
  type: 'gallery_card',
  items: [{
    type: 'media_gallery_item',
    image: {
      url: `https://www.themoviedb.org/t/p/w600_and_h900_bestv2/${movie.poster_path}`,
      size: {
        width: 'medium',
        aspect_ratio: 1.5
      }
    },
    margins: {
      top: '5x',
      left: '5x',
      bottom: '5x',
      right: '5x',
    },
    top_text: {
      text: fixTVShowName(movie.name),
      typeface: 'title1',
      text_color: 'default',
      max_lines: 2
    },
    bottom_text: {
      text: movie.overview,
      typeface: 'footnote1',
      text_color: 'secondary',
      max_lines: 10
    },
  }]
})

export const sendFirstRecommendation = async (
  foundTVShows: MovieDB.Responses.Search.TVShows,
  foundTVShowsIndex: number | undefined,
  session: Record<string, unknown>,
  req: SaluteRequest,
  res: SaluteResponse,
  dispatch: ((path: string[]) => void) | undefined
) => {
  const recommendations = await recommendTVShows(foundTVShows?.results[foundTVShowsIndex ?? 0].id)
  console.log(recommendations?.results.map(item => item.name).join(', '))
  const genres = await getGenres()
  if (recommendations && recommendations?.results?.length > 0) {
    session.genres = genres
    session.foundTVShow = foundTVShows
    session.recommendations = recommendations
    session.currentItem = 1
    session.userTVShow = req.message.original_text
    res.setAutoListening(true)
    sendNewTVShow(
      req,
      res,
      recommendations.results[0],
      genres as MovieDB.Responses.Genre.Common,
      `Рекомендации для сериала ${foundTVShows.results[foundTVShowsIndex ?? 0].name}. `
    )
  } else {
    session.recommendations = null
    res.appendBubble(`К сожалению, у меня нет рекомендаций для сериала ${foundTVShows.results[foundTVShowsIndex ?? 0].name}. Может это не тот сериал? Или попробуем найти другой сериал?`)
    res.setPronounceText(`К сожалению, у меня нет рекомендаций для сериала ${foundTVShows.results[foundTVShowsIndex ?? 0].name}. Может это не тот сериал? Или попробуем найти другой сериал?`)
    res.appendSuggestions(['Не тот сериал', 'Найти другой сериал'])
    // res.setPronounceText('К сожалению, у меня нет рекомендаций для этого сериала. Может попробуем другой сериал?')
    // dispatch && dispatch(['searchTVShow'])
  }
}