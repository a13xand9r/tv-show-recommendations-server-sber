import { createIntents, createMatchers, createUserScenario, SaluteHandler, SaluteRequest } from '@salutejs/scenario';
import MovieDB from 'node-themoviedb';
import model from './intents.json'
import { recommendTVShows, getGenres, findTVShow } from './movieApi';
import { tvShowsSuggestions } from './utils/constants';
import { createMovieCard, sendNewTVShow, sendFirstRecommendation, getRandomFromArray } from './utils/utils';
require('dotenv').config()
export const intents = createIntents(model.intents)
const { action, regexp, intent, text } = createMatchers<SaluteRequest , typeof intents>();

export const newTVShowHandler: SaluteHandler = async ({req, res, session}, dispatch) => {
  let {foundTVShows, foundTVShowsIndex} = session as {
    foundTVShows: MovieDB.Responses.Search.TVShows | null | undefined
    foundTVShowsIndex: number | undefined
  }
  if (!foundTVShows){
    foundTVShows = await findTVShow(req.message.original_text)
    session.foundTVShowsIndex = 0
    session.foundTVShows = foundTVShows
  }
  if (!foundTVShows || foundTVShows.total_results === 0) {
    res.setPronounceText('К сожалению, я не знаю таких сериалов. Может попробуем другой сериал?')
    res.appendBubble('К сожалению, я не знаю таких сериалов. Может попробуем другой сериал?')
    dispatch && dispatch(['searchTVShow'])
  } else {
    if (foundTVShows?.results[foundTVShowsIndex ?? 0]){
      await sendFirstRecommendation(foundTVShows, foundTVShowsIndex, session, req, res, dispatch)
    } else {
      res.setPronounceText('У меня больше нет сериалов по этому запросу.')
    }
  }
}

export const goToNewTVShowHandler: SaluteHandler = ({req, res, session}, dispatch) => {
  if (req.request.payload.character.appeal === 'official'){
    res.setPronounceText('Какой сериал вам нравится?')
    res.appendBubble('Какой сериал вам нравится?')
  } else {
    res.setPronounceText('Какой сериал тебе нравится?')
    res.appendBubble('Какой сериал тебе нравится?')
  }
  session.foundTVShowsIndex = 0
  dispatch && dispatch(['searchTVShow'])
}

export const howManyRecommendationsHandler: SaluteHandler = ({res, session}) => {
  const { recommendations, userTVShow } = session as { recommendations: MovieDB.Responses.TV.GetRecommendations, userTVShow: string }
  res.setPronounceText(`Всего ${recommendations.results.length} рекомендаций.`)
  res.appendSuggestions(['Найти другой сериал', 'Ещё'])
}

export const userScenario = createUserScenario({
  searchTVShow: {
    match: () => false,
    handle: ({res}) => {
      res.appendSuggestions([getRandomFromArray(tvShowsSuggestions)])
      res.setAutoListening(true)
    },
    children: {
      TVShowName: {
        match: (req) => !!req.message.original_text,
        handle: newTVShowHandler,
        children: {
          howManyRecommendations: {
            match: intent('/Сколько рекомендаций', {confidence: 0.2}),
            handle: howManyRecommendationsHandler
          },
        }
      }
    }
  },
  otherTVShow: {
    match: intent('/Не тот сериал', {confidence: 0.5}),
    handle: async ({req, res, session}, dispatch) => {
      session.foundTVShowsIndex = Number(session.foundTVShowsIndex) + 1
      let {foundTVShows, foundTVShowsIndex} = session as {
        foundTVShows: MovieDB.Responses.Search.TVShows | null | undefined
        foundTVShowsIndex: number
      }
      if (foundTVShows?.results[foundTVShowsIndex ?? 0]){
        await sendFirstRecommendation(foundTVShows, foundTVShowsIndex, session, req, res, dispatch)
      } else {
        res.setPronounceText('У меня больше нет сериалов по этому запросу.')
        res.appendSuggestions(['Найти другой сериал'])
      }
    }
  },
  getGenres: {
    match: () => false,
    handle: async ({session}, dispatch) => {
      session.genres = await getGenres()
      dispatch && dispatch(['searchTVShow'])
    }
  },
  newTVShow: {
    match: intent('/Найти сериал', {confidence: 0.2}),
    handle: goToNewTVShowHandler
  },
  nextRecommendation: {
    match: intent('/Следующий совет', { confidence: 0.2 }),
    handle: ({ req, res, session }, dispatch) => {
      const { recommendations, currentItem, genres } = session as {
        recommendations: MovieDB.Responses.TV.GetRecommendations | null,
        genres: MovieDB.Responses.Genre.Common,
        currentItem: number
      }
      console.log('currentItem', currentItem)

      if (recommendations && recommendations.total_results > currentItem) {
        const currentTVShow = recommendations.results[currentItem]
        sendNewTVShow(req, res, currentTVShow, genres)
        session.currentItem = currentItem + 1
      } else {
        res.setPronounceText('У меня больше нет рекомендаций. Может попробуем другой сериал?')
        res.appendBubble('У меня больше нет рекомендаций. Может попробуем другой сериал?')
        session.recommendations = null
        dispatch && dispatch(['searchTVShow'])
      }
      res.setAutoListening(true)
    },
    children: {
      howManyRecommendations: {
        match: intent('/Сколько рекомендаций', {confidence: 0.2}),
        handle: howManyRecommendationsHandler
      },
      yes: {
        match: intent('/Да', { confidence: 0.2 }),
        handle: goToNewTVShowHandler
      },
      no: {
        match: intent('/Нет', { confidence: 0.2 }),
        handle: ({res}) => {
          res.setPronounceText('Тогда до новых встреч.')
          res.appendBubble('Тогда до новых встреч.')
          res.finish()
        }
      }
    }
  }
})