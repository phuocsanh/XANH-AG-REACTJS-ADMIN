import dayjs from "dayjs"
import duration from "dayjs/plugin/duration"
import Cookies from "js-cookie"
import { parseJson } from "./utils"

export const getCookie = <T>(name: string): string | T => {
  const value = Cookies.get(name) as string

  return parseJson<string | T>(value)
}

export const setCookie = (
  name: string,
  value: unknown,
  expirationTime: number
) => {
  const endTimeCookie = dayjs(new Date(1000 * expirationTime))
  dayjs.extend(duration)
  const durationTime = dayjs.duration(endTimeCookie.diff(dayjs()))
  Cookies.set(name, JSON.stringify(value), {
    expires: Math.round(durationTime.asDays()),
  })
}

export const removeCookie = (name: string) => {
  if (getCookie(name)) Cookies.remove(name)
}
