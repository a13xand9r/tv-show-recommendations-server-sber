import { Card, SaluteResponse, SaluteRequest } from '@salutejs/scenario';
import MovieDB from 'node-themoviedb';

export function getRandomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(arr.length * Math.random())]
}

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
  genres: MovieDB.Responses.Genre.Common
) => {
  res.appendSuggestions(['Найти другой сериал', 'Ещё', 'Сколько всего рекомендаций?'])
  let recommendationText: string[] = []
  if (req.request.payload.character.appeal === 'official') {
    recommendationText = ['Рекомендую', 'Могу порекомендовать', 'Можете посмотреть']
    res.setPronounceText(`${getRandomFromArray(recommendationText)} ${movie.name}. ${movie.overview}. Скажите \"ещё\", чтобы посмотреть другую рекомендацию.`)
  } else {
    recommendationText = ['Рекомендую', 'Могу порекомендовать', 'Можешь посмотреть']
    res.setPronounceText(`${getRandomFromArray(recommendationText)} ${movie.name}. ${movie.overview}. Скажи \"ещё\", чтобы посмотреть другую рекомендацию.`)
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
      text: movie.name,
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