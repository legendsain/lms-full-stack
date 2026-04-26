import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const Loading = () => {
  const { path } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (path) {
      const timer = setTimeout(() => {
        navigate(`/${path}`);
      }, 5000);

      // Cleanup the timer on component unmount
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white">
      {/* Spinner */}
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-[3px] border-surface-200 border-t-brand-600 animate-spin"></div>
        <div className="absolute inset-0 w-12 h-12 rounded-full border-[3px] border-transparent border-b-brand-300 animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
      </div>
      <p className="text-sm text-surface-400 font-medium animate-pulse-soft">Loading...</p>
    </div>
  );
};

export default Loading;
