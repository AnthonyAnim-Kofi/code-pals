import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Home, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import mascot from "@/assets/mascot.png";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <img 
          src={mascot} 
          alt="Lost CodeOwl" 
          className="w-40 h-40 mx-auto mb-6 animate-bounce-gentle opacity-80"
        />
        <h1 className="text-6xl font-extrabold text-foreground mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Oops! This page flew away. Let's get you back on track.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" asChild>
            <Link to="/learn">
              <Home className="w-5 h-5" />
              Back to Learning
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/">
              <Code2 className="w-5 h-5" />
              Home Page
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
