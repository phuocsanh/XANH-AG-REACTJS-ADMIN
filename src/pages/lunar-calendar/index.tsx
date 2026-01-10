import { useState } from 'react'
import { convertSolar2Lunar } from '@/lib/lunar-calendar'
import { 
  Calendar as CalendarIcon, Moon, Sun, ChevronLeft, 
  ChevronRight, Star, Info
} from 'lucide-react'

/**
 * Lunar Calendar Page - Clone từ NextJS Client
 * Trang lịch vạn niên chi tiết với UI giống NextJS
 */
export default function LunarCalendarPage() {
  const [currentDate] = useState(new Date())
  const [viewDate, setViewDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())

  // Hàm lấy thông tin âm lịch
  const getLunarData = (date: Date) => {
    const [d, m, y, leap] = convertSolar2Lunar(date.getDate(), date.getMonth() + 1, date.getFullYear())
    return { day: d, month: m, year: y, leap }
  }

  const selectedLunar = getLunarData(selectedDate)
  
  // Hàm format ngày tháng tiếng Việt
  const getVietnameseDateString = (date: Date) => {
    return date.toLocaleDateString('vi-VN', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  // Tính số ngày trong tháng
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
  
  // Điều chỉnh để tuần bắt đầu từ Thứ 2 (0=CN -> 6, 1=T2 -> 0, ...)
  const firstDayOfMonth = (() => {
    const day = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay()
    return day === 0 ? 6 : day - 1
  })()

  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    const today = new Date()
    setViewDate(today)
    setSelectedDate(today)
  }

  return (
    <div className="min-h-screen bg-orange-50/30 pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-orange-600 to-red-700 pt-5 pb-16 sm:pt-5 sm:pb-24 px-4 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-20 translate-x-20" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-400/20 rounded-full blur-2xl translate-y-20 -translate-x-20" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 sm:gap-12">
            <div className="text-center lg:text-left">
              <h1 className="text-3xl md:text-7xl font-black text-white mb-4 sm:mb-6 tracking-tighter">
                LỊCH <span className="text-orange-200">VẠN NIÊN</span>
              </h1>
              <p className="text-orange-100 text-sm sm:text-lg max-w-xl leading-relaxed">
                Tra cứu ngày âm, ngày dương, tiết khí và các thông tin phong thủy phục vụ đời sống và sản xuất nông nghiệp của bà con.
              </p>
              <button 
                onClick={goToToday}
                className="mt-6 sm:mt-8 px-6 sm:px-8 py-2.5 sm:py-3 bg-white text-orange-700 font-black rounded-full shadow-xl hover:bg-orange-50 transition-all transform hover:scale-105 text-sm sm:text-base"
              >
                Hôm nay: {currentDate.getDate()}/{currentDate.getMonth() + 1}
              </button>
            </div>

            {/* Featured Date Card */}
            <div className="bg-white rounded-[40px] p-1 shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
               <div className="bg-white rounded-[39px] border-4 border-orange-50 p-10 flex flex-col items-center min-w-[320px]">
                  <p className="text-orange-600 font-black uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
                    <Sun className="w-4 h-4" /> Dương lịch
                  </p>
                  <p className="text-8xl font-black text-gray-800 tabular-nums">{selectedDate.getDate()}</p>
                  <p className="text-xl font-bold text-gray-500 mt-2">{getVietnameseDateString(selectedDate)}</p>
                  
                  <div className="w-full h-px bg-gray-100 my-8" />
                  
                  <p className="text-red-500 font-black uppercase tracking-widest text-sm mb-4 flex items-center gap-2">
                    <Moon className="w-4 h-4" /> Âm lịch
                  </p>
                  <p className="text-3xl font-black text-red-600">
                    Ngày {selectedLunar.day}
                  </p>
                  <p className="text-lg font-bold text-red-500/80">
                    Tháng {selectedLunar.month} Năm {selectedLunar.year}
                    {selectedLunar.leap ? ' (Nhuận)' : ''}
                  </p>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-0  sm:px-4 -mt-12 relative z-20">
        <div className="grid lg:grid-cols-3 gap-10">
          {/* Calendar Grid */}
          <div className="lg:col-span-2 bg-white rounded-[2rem] sm:rounded-[40px] shadow-2xl border border-orange-100 p-1.5 sm:p-8 md:p-12">
            <div className="flex justify-between items-center mb-6 sm:mb-12">
              <h2 className="text-xl sm:text-3xl font-black text-gray-800 flex items-center gap-2 sm:gap-4">
                <CalendarIcon className="w-8 h-8 text-orange-500" />
                Tháng {viewDate.getMonth() + 1} - {viewDate.getFullYear()}
              </h2>
              <div className="flex gap-2">
                <button onClick={prevMonth} className="p-3 hover:bg-orange-50 rounded-2xl transition-all border border-transparent hover:border-orange-100">
                  <ChevronLeft className="w-6 h-6 text-gray-400" />
                </button>
                <button onClick={nextMonth} className="p-3 hover:bg-orange-50 rounded-2xl transition-all border border-transparent hover:border-orange-100">
                   <ChevronRight className="w-6 h-6 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 sm:gap-4 text-center mb-6">
              {['Thứ\nHai', 'Thứ\nBa', 'Thứ\nTư', 'Thứ\nNăm', 'Thứ\nSáu', 'Thứ\nBảy', 'Chủ\nNhật'].map((day, i) => (
                <span key={day} className={`text-[10px] sm:text-xs font-black uppercase tracking-wider whitespace-pre-line leading-tight ${i === 6 ? 'text-red-500' : 'text-gray-400'}`}>
                  {day}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2.5 md:gap-4 mb-4">
              {/* Ngày của tháng trước */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => {
                const prevMonthDays = daysInMonth(
                  viewDate.getMonth() === 0 ? viewDate.getFullYear() - 1 : viewDate.getFullYear(),
                  viewDate.getMonth() === 0 ? 11 : viewDate.getMonth() - 1
                )
                const prevDateNum = prevMonthDays - firstDayOfMonth + i + 1
                const prevDate = new Date(
                  viewDate.getMonth() === 0 ? viewDate.getFullYear() - 1 : viewDate.getFullYear(),
                  viewDate.getMonth() === 0 ? 11 : viewDate.getMonth() - 1,
                  prevDateNum
                )
                const prevLunar = getLunarData(prevDate)
                const isSelected = prevDateNum === selectedDate.getDate() &&
                                  (viewDate.getMonth() === 0 ? 11 : viewDate.getMonth() - 1) === selectedDate.getMonth() &&
                                  (viewDate.getMonth() === 0 ? viewDate.getFullYear() - 1 : viewDate.getFullYear()) === selectedDate.getFullYear()
                
                return (
                  <button
                    key={`prev-${i}`}
                    onClick={() => setSelectedDate(prevDate)}
                    className={`group relative aspect-square flex flex-col items-center justify-center rounded-xl sm:rounded-2xl transition-all duration-300 shadow-sm py-1 ${
                      isSelected
                      ? 'bg-orange-600 text-white shadow-xl scale-110 z-10 ring-2 ring-white/20'
                      : 'bg-gray-50/50 hover:bg-gray-100 border border-gray-50 hover:border-gray-200'
                    }`}
                  >
                    <span className={`text-base sm:text-2xl leading-none ${isSelected ? 'font-black' : 'font-bold text-gray-600'} mb-1`}>
                      {prevDateNum}
                    </span>
                    <span className={`text-xs sm:text-base font-black ${isSelected ? 'text-orange-100' : 'text-gray-500'}`}>
                      {prevLunar.day}/{prevLunar.month}
                    </span>
                  </button>
                )
              })}
              {Array.from({ length: daysInMonth(viewDate.getFullYear(), viewDate.getMonth()) }).map((_, i) => {
                const dateNum = i + 1
                const isToday = dateNum === currentDate.getDate() && 
                               viewDate.getMonth() === currentDate.getMonth() && 
                               viewDate.getFullYear() === currentDate.getFullYear()
                const isSelected = dateNum === selectedDate.getDate() &&
                                  viewDate.getMonth() === selectedDate.getMonth() &&
                                  viewDate.getFullYear() === selectedDate.getFullYear()
                
                const cellDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), dateNum)
                const cellLunar = getLunarData(cellDate)
                // Điều chỉnh weekend: CN = 0, T7 = 6
                const isWeekend = cellDate.getDay() === 0 || cellDate.getDay() === 6

                return (
                  <button
                    key={dateNum}
                    onClick={() => setSelectedDate(cellDate)}
                    className={`group relative aspect-square flex flex-col items-center justify-center rounded-xl sm:rounded-2xl transition-all duration-300 shadow-sm  py-1 ${
                      isSelected 
                      ? 'bg-orange-600 text-white shadow-xl scale-110 z-10 ring-2 ring-white/20' 
                      : 'bg-white/80 hover:bg-orange-50 shadow-md hover:shadow-lg border border-gray-100 hover:border-orange-200'
                    } ${isToday && !isSelected ? 'ring-2 sm:ring-4 ring-orange-400 bg-white shadow-lg' : ''} ${isWeekend && !isSelected ? 'text-red-500' : ''}`}
                  >
                    <span className={`text-base sm:text-2xl leading-none ${isSelected ? 'font-black' : 'font-bold'} mb-1`}>
                      {dateNum}
                    </span>
                    <span className={`text-xs sm:text-base font-black ${isSelected ? 'text-orange-100' : 'text-gray-500'}`}>
                      {cellLunar.day}/{cellLunar.month}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-8">
             <div className="bg-white rounded-[40px] p-8 shadow-xl border border-orange-100">
                <h3 className="font-black text-xl text-gray-800 mb-6 flex items-center gap-3">
                  <Star className="w-6 h-6 text-accent-gold" />
                  Tiết khí & Sản xuất
                </h3>
                <div className="space-y-6">
                   <div className="p-5 rounded-3xl bg-orange-50/50 border border-orange-100">
                      <p className="font-black text-orange-700 text-sm mb-2">Lời khuyên nông vụ</p>
                      <p className="text-gray-600 text-sm leading-relaxed italic">
                        &quot;Tháng chạp là tháng làm ăn, <br/> Lo gieo mạ sớm, dọn ngăn ruộng đồng.&quot;
                      </p>
                   </div>
                   <div className="p-5 rounded-3xl bg-gray-50 border border-gray-100">
                      <p className="font-black text-gray-700 text-sm mb-1">Gợi ý hôm nay</p>
                      <ul className="text-xs text-gray-500 space-y-2 list-disc pl-4 font-medium">
                        <li>Thích hợp cho việc cày bừa, làm đất.</li>
                        <li>Tránh việc xuống giống quy mô lớn.</li>
                        <li>Tốt cho việc sửa chữa chuồng trại.</li>
                      </ul>
                   </div>
                </div>
             </div>

             <div className="bg-gradient-to-br from-gray-800 to-black rounded-[40px] p-8 shadow-2xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full blur-2xl -translate-y-10 translate-x-10" />
                <h3 className="font-black text-xl mb-6 relative z-10">Mẹo xem lịch</h3>
                <div className="space-y-4 relative z-10">
                   <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 text-orange-400">
                        <Info className="w-4 h-4" />
                      </div>
                      <p className="text-sm text-gray-300">Nhấn vào từng ngày trên lịch để xem chi tiết thông tin âm dương ở khung bên trên.</p>
                   </div>
                   <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 text-red-400">
                        <Info className="w-4 h-4" />
                      </div>
                      <p className="text-sm text-gray-300">Ngày màu đỏ thể hiện các ngày cuối tuần hoặc ngày đặc biệt.</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
