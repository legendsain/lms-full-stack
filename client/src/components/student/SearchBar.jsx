import React, { useState } from 'react'
import { assets } from '../../assets/assets'
import { useNavigate } from 'react-router-dom'

const SearchBar = ({ data }) => {

  const navigate = useNavigate()

  const [input, setInput] = useState(data ? data : '')

  const onSearchHandler = (e) => {
    e.preventDefault()
    navigate('/course-list/' + input)
  }

  return (
    <form onSubmit={onSearchHandler} className="max-w-xl w-full md:h-14 h-12 flex items-center bg-white border border-surface-200 rounded-2xl shadow-elevated hover:shadow-lg hover:border-surface-300 transition-all duration-300 group">
      <div className="pl-4 pr-2 text-surface-400 group-focus-within:text-brand-500 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
      </div>
      <input 
        onChange={e => setInput(e.target.value)} 
        value={input} 
        type="text" 
        className="w-full h-full outline-none text-surface-700 placeholder:text-surface-400 text-sm bg-transparent px-2" 
        placeholder="Search for courses, topics, or skills..." 
      />
      <button type='submit' className="btn-primary !rounded-xl mr-1.5 !px-6 !py-2 flex-shrink-0">
        Search
      </button>
    </form>
  )
}

export default SearchBar