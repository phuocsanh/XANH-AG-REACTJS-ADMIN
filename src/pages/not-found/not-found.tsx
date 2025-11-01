import { Link } from "react-router-dom"

export default function NotFound() {
  return (
    <div className='min-h-screen flex flex-col items-center justify-center bg-gray-100'>
      <div className='text-center'>
        <h1 className='text-6xl font-bold text-gray-800 mb-4'>404</h1>
        <h2 className='text-3xl font-semibold text-gray-700 mb-6'>
          Page Not Found
        </h2>
        <p className='text-gray-600 mb-8'>
          Sorry, the page you are looking for does not exist.
        </p>
        <Link
          to='/'
          className='px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition duration-300'
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
