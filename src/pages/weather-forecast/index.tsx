import React, { useState, useEffect, useMemo, useRef } from 'react'
import { weatherService, WeatherData, DailyWeatherData } from '@/services/weather.service'
import { VIETNAM_LOCATIONS } from '@/constants/locations'
import { 
  MapPin, 
  Navigation, 
  Search, 
  Cloud, 
  Sun, 
  CloudRain, 
  RefreshCw, 
  Droplets, 
  Wind, 
  Thermometer,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import LocationMap from '@/components/LocationMap'

const DEFAULT_COORD = {
  latitude: 10.5216,
  longitude: 105.1258
}

/**
 * Weather Forecast Page - Clone từ NextJS Client
 * Trang dự báo thời tiết chi tiết 6 ngày với UI giống NextJS
 */
export default function WeatherForecastPage() {
  const [dailyForecast, setDailyForecast] = useState<DailyWeatherData[]>([])
  const [hourlyForecast, setHourlyForecast] = useState<WeatherData[]>([])
  const [loading, setLoading] = useState(true)
  const [locationName, setLocationName] = useState('Đang xác định vị trí...')
  const [coords, setCoords] = useState(DEFAULT_COORD)
  const [activeTab, setActiveTab] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const [geoError, setGeoError] = useState<string | null>(null)

  // Drag to scroll logic
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeftPos, setScrollLeftPos] = useState(0)

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return
    setIsDragging(true)
    setStartX(e.pageX - scrollRef.current.offsetLeft)
    setScrollLeftPos(scrollRef.current.scrollLeft)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollRef.current.offsetLeft
    const walk = (x - startX) * 2
    scrollRef.current.scrollLeft = scrollLeftPos - walk
  }

  const fetchWeather = async (lat: number, lon: number, name?: string) => {
    setLoading(true)
    try {
      const [daily, hourly] = await Promise.all([
        weatherService.getDailyForecast7Days(lat, lon),
        weatherService.getForecast7Days(lat, lon)
      ])
      setDailyForecast(daily)
      setHourlyForecast(hourly)
      
      if (!name || name === 'An Giang' || name === 'Vị trí hiện tại') {
        const detectedName = await weatherService.getPlaceName(lat, lon)
        if (detectedName) {
          setLocationName(detectedName)
        } else if (!name) {
          setLocationName(`${lat.toFixed(4)}, ${lon.toFixed(4)}`)
        }
      } else {
        setLocationName(name)
      }
      setCoords({ latitude: lat, longitude: lon })
    } catch (error) {
      console.error('Failed to fetch weather:', error)
    } finally {
      setLoading(false)
    }
  }

  const detectLocation = (isSilent = false) => {
    if (!isSilent) setGeoError(null)
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGeoError('Trình duyện không hỗ trợ định vị.')
      fetchWeather(DEFAULT_COORD.latitude, DEFAULT_COORD.longitude, 'An Giang')
      return
    }

    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setGeoError('Định vị GPS yêu cầu kết nối bảo mật (HTTPS). Vui lòng chọn vị trí thủ công trên bản đồ.')
      fetchWeather(DEFAULT_COORD.latitude, DEFAULT_COORD.longitude, 'An Giang')
      return
    }

    setLoading(true)
    let hasGotPosition = false
    let watchId: number | null = null

    const handleSuccess = async (position: GeolocationPosition) => {
      if (hasGotPosition) return
      hasGotPosition = true
      if (watchId !== null) navigator.geolocation.clearWatch(watchId)
      
      const lat = position.coords.latitude
      const lon = position.coords.longitude
      console.log('GPS Detected:', lat, lon)
      const name = await weatherService.getPlaceName(lat, lon)
      fetchWeather(lat, lon, name)
    }

    const handleError = (error: GeolocationPositionError) => {
      if (hasGotPosition) return
      console.warn('Geolocation error:', error)
      
      if (isSilent && error.code !== 1) {
        fetchWeather(DEFAULT_COORD.latitude, DEFAULT_COORD.longitude, 'An Giang')
        setLoading(false)
        return
      }

      let msg = 'Không thể lấy vị trí.'
      if (error.code === 1) msg = 'Quyền truy cập vị trí bị từ chối hoặc yêu cầu HTTPS.'
      if (error.code === 2) msg = 'Thiết bị không thể xác định vị trí. Vui lòng kiểm tra cài đặt GPS hoặc chọn trên bản đồ.'
      if (error.code === 3) msg = 'Quá thời gian lấy vị trí. Hệ thống sẽ dùng vị trí mặc định.'
      
      setGeoError(msg)
      fetchWeather(DEFAULT_COORD.latitude, DEFAULT_COORD.longitude, 'An Giang')
    }

    navigator.geolocation.getCurrentPosition(handleSuccess, (error) => {
      if (error.code === 2 || error.code === 3) {
        console.log('Low accuracy failed, trying watchPosition fallback...')
        watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 300000
        })

        setTimeout(() => {
          if (!hasGotPosition && watchId !== null) {
            navigator.geolocation.clearWatch(watchId)
            handleError({ code: 3, message: 'Timeout' } as GeolocationPositionError)
          }
        }, 15000)
      } else {
        handleError(error)
      }
    }, {
      enableHighAccuracy: false,
      timeout: 5000,
      maximumAge: 300000
    })
  }

  useEffect(() => {
    detectLocation(true)
  }, [])

  const filteredLocations = useMemo(() => {
    return VIETNAM_LOCATIONS.filter(loc => 
      loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.region.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [searchTerm])

  const getWeatherIcon = (code: number, size = "w-8 h-8") => {
    if (code === 0 || code === 1) return <Sun className={`${size} text-yellow-400`} />
    if (code >= 2 && code <= 3) return <Cloud className={`${size} text-blue-400`} />
    if (code >= 51 && code <= 65) return <CloudRain className={`${size} text-blue-600`} />
    if (code >= 80 && code <= 82) return <CloudRain className={`${size} text-blue-800`} />
    return <Cloud className={`${size} text-gray-400`} />
  }

  const getPopStyle = (popPercentage: number) => {
    if (popPercentage === 0) return "bg-blue-50 text-blue-500 border-blue-100";
    if (popPercentage <= 24) return "bg-yellow-50 text-yellow-600 border-yellow-200 font-bold";
    if (popPercentage <= 49) return "bg-yellow-200 text-yellow-800 border-yellow-400 font-bold";
    if (popPercentage <= 74) return "bg-orange-100 text-orange-600 border-orange-300 font-bold";
    return "bg-red-100 text-red-600 border-red-300 font-bold";
  };

  const selectedDay = dailyForecast[activeTab] || dailyForecast[0]
  const hourlyForSelectedDay = hourlyForecast.filter(h => {
    if (!selectedDay) return false
    const dayDate = new Date(selectedDay.date).toDateString()
    const hourlyDate = new Date(h.dt * 1000).toDateString()
    return dayDate === hourlyDate
  })

  const displaySummary = useMemo(() => {
    if (!selectedDay || hourlyForSelectedDay.length === 0) return selectedDay;

    const temps = hourlyForSelectedDay.map(h => h.main.temp);
    const rainSum = hourlyForSelectedDay.reduce((sum, h) => sum + (h.rain?.['1h'] || 0), 0);
    
    let maxPopHour = null;
    if (hourlyForSelectedDay.length > 0) {
      const maxPopItem = hourlyForSelectedDay.reduce((prev, current) => (prev.pop > current.pop) ? prev : current);
      maxPopHour = new Date(maxPopItem.dt * 1000).getHours();
    }

    return {
      ...selectedDay,
      tempMin: Math.round(Math.min(...temps)),
      tempMax: Math.round(Math.max(...temps)),
      precipitationSum: parseFloat(rainSum.toFixed(1)),
      precipitationProbabilityMax: Math.round(Math.max(...hourlyForSelectedDay.map(h => h.pop)) * 100),
      peakPrecipitationHour: maxPopHour
    };
  }, [selectedDay, hourlyForSelectedDay]);

  return (
    <div className="min-h-screen bg-agri-50/50 pb-10 sm:pb-20 overflow-x-hidden w-full relative">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-agri-600 via-agri-700 to-agri-800 pt-[100px] sm:pt-[110px] pb-10 sm:pb-14 px-3 sm:px-4 overflow-hidden relative w-full -mt-[70px]">
        <div className="max-w-7xl mx-auto w-full">
          {/* Detailed Location Card */}
          <div className="bg-white/95 backdrop-blur-xl p-4 sm:p-6 md:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-xl border border-white relative w-full overflow-hidden">
            <div className="flex flex-col gap-4 sm:gap-6 w-full">
              {/* Address Header */}
              <div className="flex items-start gap-3 sm:gap-6 w-full">
                <div className="bg-blue-50 p-2 sm:p-4 rounded-xl sm:rounded-3xl border border-blue-100 shadow-inner flex-shrink-0">
                  <MapPin className="w-6 h-6 sm:w-10 sm:h-10 text-blue-600 sm:animate-bounce" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] sm:text-[11px] font-black text-blue-500 uppercase tracking-widest sm:tracking-[0.3em] mb-1">Vị trí hiện tại</p>
                  <h1 className="text-lg sm:text-2xl md:text-3xl font-black text-gray-900 leading-tight break-words">
                    {locationName} | Dự báo 6 Ngày
                  </h1>

                  {geoError && (
                    <div className="mt-3 p-2 sm:p-3 bg-amber-50 border border-amber-200 rounded-lg sm:rounded-xl flex items-center gap-2 sm:gap-3 text-amber-700 w-full overflow-hidden">
                      <Search className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <p className="text-[10px] sm:text-xs font-bold leading-relaxed break-words">
                        {geoError}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-gray-100 w-full">
                <button 
                  onClick={() => detectLocation(false)} 
                  className={`flex items-center gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-wider transition-all active:scale-95 shadow-md group ${geoError && geoError.includes('HTTPS') ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                  disabled={!!geoError && geoError.includes('HTTPS')}
                >
                  <Navigation className="w-3.5 h-3.5 sm:w-5 sm:h-5 group-hover:animate-pulse" />
                  Vị trí hiện tại
                </button>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogContent className="w-[95vw] sm:max-w-[850px] max-h-[90vh] flex flex-col p-4 sm:p-8 overflow-hidden bg-white border-none shadow-2xl rounded-[1.5rem] sm:rounded-[3rem]">
                      <DialogHeader className="mb-4 sm:mb-6">
                        <DialogTitle className="text-xl sm:text-3xl font-black text-agri-800 flex items-center gap-2 sm:gap-3">
                          <MapPin className="text-agri-600 w-5 h-5 sm:w-8 sm:h-8" />
                          Chọn vị trí canh tác
                        </DialogTitle>
                      </DialogHeader>
                      
                      <div className="grid md:grid-cols-5 gap-4 sm:gap-8 flex-grow overflow-hidden w-full">
                        <div className="md:col-span-3 h-[300px] md:h-full w-full overflow-hidden rounded-2xl">
                          <LocationMap 
                            selectedLocation={{
                              id: 'current-location',
                              latitude: coords.latitude,
                              longitude: coords.longitude,
                              name: locationName,
                              region: 'Vị trí hiện tại'
                            }}
                            onLocationSelect={(loc) => {
                              fetchWeather(loc.latitude, loc.longitude, loc.name)
                              setIsDialogOpen(false)
                            }}
                          />
                        </div>

                        <div className="md:col-span-2 flex flex-col gap-4 overflow-hidden w-full">
                          <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-agri-400" />
                            <Input 
                              placeholder="Tìm tỉnh thành..." 
                              className="pl-10 h-10 sm:h-14 rounded-xl sm:rounded-2xl border-agri-100 bg-agri-50/50 font-bold text-sm w-full"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </div>

                          <div className="flex-grow overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-thumb-agri-200 w-full">
                            {filteredLocations.map((loc) => (
                              <button
                                key={loc.id}
                                onClick={() => {
                                  fetchWeather(loc.latitude, loc.longitude, loc.name)
                                  setIsDialogOpen(false)
                                }}
                                className="w-full text-left p-3 sm:p-4 rounded-xl sm:rounded-2xl hover:bg-agri-600 transition-all flex items-center justify-between group bg-white border border-gray-100 hover:border-agri-600 shadow-sm"
                              >
                                <div className="min-w-0 pr-2">
                                  <p className="font-black text-sm sm:text-base text-gray-800 group-hover:text-white transition-colors truncate">{loc.name}</p>
                                  <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest group-hover:text-agri-100 transition-colors mt-0.5">{loc.region}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                  </DialogContent>
                </Dialog>

                <button 
                  onClick={() => detectLocation(false)} 
                  className="flex items-center gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-white text-gray-600 rounded-lg sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-wider hover:bg-gray-50 transition-all active:scale-95 border border-gray-200 shadow-sm"
                >
                  <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Làm mới</span>
                  <span className="sm:hidden">Mới</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[100vw] overflow-x-hidden px-3 sm:px-4 md:px-6 -mt-4 sm:-mt-10 xl:-mt-16 relative z-20">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid xl:grid-cols-4 gap-6 sm:gap-8 w-full">
            {/* Day Selector Tabs */}
            <div className="xl:col-span-3 xl:col-start-2 order-1 xl:order-1 w-full overflow-hidden">
              <div 
                ref={scrollRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                className={`flex flex-nowrap mt-3 gap-3 sm:gap-4 overflow-x-auto pb-10 pt-4 scrollbar-hide touch-pan-x mx-4 px-3 ${isDragging ? 'cursor-grabbing select-none' : 'cursor-grab scroll-smooth snap-x snap-mandatory scroll-pl-3'}`}
              >
                {dailyForecast.map((day, i) => (
                  <button
                    key={day.date}
                    onClick={() => setActiveTab(i)}
                    className={`flex-shrink-0 snap-start min-w-[110px] sm:min-w-[140px] p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] transition-all duration-300 transform ${i === 0 ? 'ml-1' : ''} ${
                      activeTab === i 
                      ? 'bg-agri-600 text-white shadow-xl scale-[1.03] sm:scale-105 ring-2 sm:ring-4 ring-agri-100' 
                      : 'bg-white text-gray-500 hover:bg-agri-50 border border-agri-100 hover:scale-[1.02]'
                    }`}
                  >
                    <p className={`text-[8px] sm:text-[10px] font-black uppercase mb-1 sm:mb-3 tracking-widest ${activeTab === i ? 'text-agri-200' : 'text-gray-400'}`}>
                      {new Date(day.date).toLocaleDateString('vi', { weekday: 'long' }).toUpperCase()}
                    </p>
                    <div className="flex flex-col items-center">
                      <p className="text-xl sm:text-3xl font-black tabular-nums">{new Date(day.date).getDate()}<span className="text-xs sm:text-lg opacity-50 ml-0.5">/{new Date(day.date).getMonth() + 1}</span></p>
                      <p className={`text-[7px] sm:text-[9px] font-bold uppercase tracking-wider mt-0.5 ${activeTab === i ? 'text-agri-200' : 'text-gray-400'}`}>Ngày/Tháng</p>
                    </div>
                    <div className="my-3 sm:my-5 flex justify-center">
                      {getWeatherIcon(day.weatherCode, "w-8 h-8 sm:w-12 sm:h-12")}
                    </div>
                    <p className={`text-[11px] sm:text-sm font-black ${activeTab === i ? 'text-white' : 'text-gray-800'}`}>{day.tempMax}°<span className="opacity-40 font-bold mx-1">/</span>{day.tempMin}°</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Detailed Stats Column */}
            <div className="xl:col-span-1 xl:col-start-1 order-2 xl:order-1 w-full overflow-hidden">
              <div className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] p-5 sm:p-8 shadow-xl border border-agri-100 flex flex-col gap-5 sm:gap-8 xl:sticky  w-full">
                <div className="border-b border-gray-100 pb-3 sm:pb-4">
                  <h3 className="font-black text-gray-800 text-base sm:text-xl tracking-tight mb-2">Chi tiết theo ngày</h3>
                  {selectedDay && (
                    <div className="px-3 py-1.5 bg-agri-50 text-agri-700 rounded-xl text-xs sm:text-sm font-black border border-agri-200 w-fit">
                      📅 {new Date(selectedDay.date).toLocaleDateString('vi', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-4 sm:gap-6 w-full">
                  <div className="flex items-center gap-3 sm:gap-5 w-full">
                    <div className="p-3 sm:p-4 bg-blue-50 rounded-xl sm:rounded-2xl text-blue-600 shadow-sm flex-shrink-0"><Droplets className="w-5 h-5 sm:w-7 sm:h-7" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] sm:text-xs text-gray-400 font-black uppercase tracking-widest truncate">Khả năng mưa</p>
                      <div className="flex items-baseline gap-2">
                        <p className={`text-lg sm:text-2xl font-black px-2 py-0.5 rounded-lg ${getPopStyle(displaySummary?.precipitationProbabilityMax ?? 0)}`}>
                          {displaySummary?.precipitationProbabilityMax ?? 0}%
                        </p>
                        {(displaySummary as any)?.peakPrecipitationHour !== null && (displaySummary as any)?.precipitationProbabilityMax > 0 && (
                          <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full ${getPopStyle(displaySummary?.precipitationProbabilityMax ?? 0)}`}>
                            Lúc { (displaySummary as any).peakPrecipitationHour }h
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-5 w-full">
                    <div className="p-3 sm:p-4 bg-cyan-50 rounded-xl sm:rounded-2xl text-cyan-600 shadow-sm flex-shrink-0"><Wind className="w-5 h-5 sm:w-7 sm:h-7" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] sm:text-xs text-gray-400 font-black uppercase tracking-widest truncate">Lượng mưa</p>
                      <p className="text-lg sm:text-2xl font-black text-gray-800">{displaySummary?.precipitationSum ?? 0} mm</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-5 w-full">
                    <div className="p-3 sm:p-4 bg-orange-50 rounded-xl sm:rounded-2xl text-orange-600 shadow-sm flex-shrink-0"><Thermometer className="w-5 h-5 sm:w-7 sm:h-7" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] sm:text-xs text-gray-400 font-black uppercase tracking-widest truncate">Khoảng nhiệt độ</p>
                      <p className="text-lg sm:text-2xl font-black text-gray-800">{displaySummary?.tempMin ?? 0}° - {displaySummary?.tempMax ?? 0}°</p>
                    </div>
                  </div>
                </div>

                <div className="mt-2 p-4 sm:p-6 bg-gradient-to-br from-agri-50 to-white rounded-2xl sm:rounded-3xl border border-agri-100 italic text-[11px] sm:text-sm text-agri-800 leading-relaxed font-medium shadow-inner w-full overflow-hidden">
                  <p className="break-words whitespace-normal w-full">
                    💡 Lời khuyên nông vụ: {(displaySummary?.precipitationProbabilityMax ?? 0) > 50 
                      ? 'Khả năng mưa cao, bà con nên kiểm tra hệ thống thoát nước ruộng và tạm hoãn phun thuốc nông dược.' 
                      : 'Thời tiết thuận lợi, bà con có thể tiến hành bón phân hoặc phun thuốc theo kế hoạch.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Hourly Details List */}
            <div className="xl:col-span-3 xl:col-start-2 order-3 xl:order-2 space-y-6 sm:space-y-8 w-full overflow-hidden">
              <div className="bg-white rounded-[2rem] sm:rounded-[3rem] p-5 sm:p-10 shadow-xl sm:shadow-2xl border border-agri-100 relative overflow-hidden w-full">
                 {loading && dailyForecast.length > 0 && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-8 h-8 sm:w-10 sm:h-10 text-agri-600 animate-spin" />
                      <p className="text-[9px] sm:text-[10px] font-black text-agri-600 uppercase tracking-widest">Đang cập nhật...</p>
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-10 gap-3 w-full">
                  <h3 className="text-xl sm:text-3xl font-black text-gray-800 tracking-tight">Chi tiết theo giờ</h3>
                  <div className="px-4 py-1.5 sm:px-6 sm:py-2.5 bg-gray-100 text-gray-600 rounded-xl sm:rounded-2xl text-[10px] sm:text-sm font-black border border-gray-200 shadow-sm w-fit">
                    📅 {selectedDay ? new Date(selectedDay.date).toLocaleDateString('vi', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 sm:gap-6 w-full">
                  {hourlyForSelectedDay.map((hour) => {
                    const now = new Date()
                    const hourDate = new Date(hour.dt * 1000)
                    const isCurrentHour = now.getHours() === hourDate.getHours() && 
                                         now.getDate() === hourDate.getDate()
                    
                    return (
                      <div 
                        key={hour.dt} 
                        className={`flex items-center justify-between p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border-2 transition-all group shadow-sm hover:shadow-lg w-full overflow-hidden ${
                          isCurrentHour 
                            ? 'bg-agri-50 border-agri-400 ring-2 ring-agri-200' 
                            : 'bg-gray-50/50 border-transparent hover:border-agri-200 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-4 sm:gap-10 min-w-0 flex-1">
                          <div className="flex flex-col items-center min-w-[50px] sm:min-w-[60px] flex-shrink-0">
                            <p className={`text-[9px] sm:text-[11px] font-black uppercase tracking-widest mb-1 transition-colors ${
                              isCurrentHour ? 'text-agri-700' : 'text-gray-600 group-hover:text-agri-600'
                            }`}>
                              {isCurrentHour ? 'Hiện tại' : 'Giờ'}
                            </p>
                            <span className={`text-lg sm:text-2xl font-black tabular-nums leading-none ${
                              isCurrentHour ? 'text-agri-900' : 'text-gray-800 group-hover:text-agri-900'
                            }`}>
                              {new Date(hour.dt * 1000).toLocaleTimeString('vi', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className="flex flex-col gap-2 sm:gap-3 min-w-0 flex-1">
                            <p className={`text-base sm:text-xl font-black leading-none truncate ${
                              isCurrentHour ? 'text-agri-900' : 'text-gray-900 group-hover:text-agri-800'
                            }`}>
                              {hour.weather[0]?.description ?? 'N/A'}
                            </p>
                            
                            <div className={`flex items-center gap-1.5 sm:gap-2 w-fit px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border transition-colors ${getPopStyle(Math.round((hour.pop ?? 0) * 100))}`}>
                              <Droplets className={`w-3.5 h-3.5 sm:w-5 sm:h-5 flex-shrink-0 ${Math.round((hour.pop ?? 0) * 100) > 49 ? 'text-white' : ''}`} />
                              <span className="text-[10px] sm:text-[13px] font-black uppercase tracking-tight truncate">Mưa: {Math.round((hour.pop ?? 0) * 100)}%</span>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-[9px] sm:text-[12px] text-gray-700 font-black uppercase tracking-tight w-full">
                              <span className="flex items-center gap-1.5 shrink-0">
                                <Wind className="w-4 h-4 text-cyan-600" /> 
                                <span>{hour.wind?.speed ?? 0}m/s</span>
                              </span>
                              <span className="flex items-center gap-1.5 shrink-0">
                                <Thermometer className="w-4 h-4 text-orange-600" /> 
                                <span>{hour.main?.humidity ?? 0}% Ẩm</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0 ml-2">
                          <p className={`text-3xl sm:text-5xl font-black tabular-nums leading-none ${
                            isCurrentHour ? 'text-agri-700' : 'text-agri-900'
                          }`}>
                            {Math.round(hour.main?.temp ?? 0)}°
                          </p>
                          <p className="text-[9px] sm:text-[11px] font-black text-gray-600 uppercase tracking-widest mt-1">Nhiệt độ</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  )
}
