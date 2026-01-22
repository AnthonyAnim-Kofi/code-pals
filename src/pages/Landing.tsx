import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Code2, 
  Sparkles, 
  Trophy, 
  Zap, 
  CheckCircle2,
  ArrowRight,
  Play
} from "lucide-react";
import mascot from "@/assets/mascot.png";
import heroBg from "@/assets/hero-bg.png";

const features = [
  {
    icon: Sparkles,
    title: "Bite-sized lessons",
    description: "Learn to code in quick, fun, 5-minute lessons. Perfect for busy schedules.",
  },
  {
    icon: Zap,
    title: "Practice by doing",
    description: "Write real code from day one. Interactive challenges keep you engaged.",
  },
  {
    icon: Trophy,
    title: "Stay motivated",
    description: "Earn XP, unlock achievements, and compete with friends on leaderboards.",
  },
];

const languages = [
  { name: "Python", color: "bg-[#3776AB]", icon: "🐍" },
  { name: "JavaScript", color: "bg-[#F7DF1E]", icon: "⚡" },
  { name: "TypeScript", color: "bg-[#3178C6]", icon: "📘" },
  { name: "Rust", color: "bg-[#B7410E]", icon: "🦀" },
  { name: "Go", color: "bg-[#00ADD8]", icon: "🐹" },
  { name: "SQL", color: "bg-[#336791]", icon: "🗄️" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary">
                <Code2 className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-extrabold text-foreground">CodeOwl</span>
            </Link>

            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link to="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section 
        className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground mb-6 leading-tight">
                Learn to code the{" "}
                <span className="text-gradient-primary">fun way</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto lg:mx-0">
                Master programming with bite-sized lessons, interactive challenges, 
                and a gamified experience that keeps you coming back for more.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="xl" asChild>
                  <Link to="/signup">
                    Start Learning Free
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button size="xl" variant="outline" asChild>
                  <Link to="/learn">
                    <Play className="w-5 h-5" />
                    Watch Demo
                  </Link>
                </Button>
              </div>

              {/* Social Proof */}
              <div className="mt-10 flex items-center gap-6 justify-center lg:justify-start">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div 
                      key={i} 
                      className="w-10 h-10 rounded-full bg-muted border-2 border-background flex items-center justify-center text-lg"
                    >
                      {['😊', '🤓', '😎', '🧑‍💻', '👩‍💻'][i - 1]}
                    </div>
                  ))}
                </div>
                <div className="text-left">
                  <p className="font-bold text-foreground">50,000+ learners</p>
                  <p className="text-sm text-muted-foreground">already coding</p>
                </div>
              </div>
            </div>

            {/* Mascot */}
            <div className="flex-1 flex justify-center">
              <img 
                src={mascot} 
                alt="CodeOwl mascot" 
                className="w-64 lg:w-80 animate-float drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Languages */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-extrabold text-center text-foreground mb-8">
            Learn popular programming languages
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {languages.map((lang) => (
              <div 
                key={lang.name}
                className="flex items-center gap-3 px-5 py-3 bg-card rounded-2xl border border-border card-elevated hover:scale-105 transition-transform cursor-pointer"
              >
                <span className="text-2xl">{lang.icon}</span>
                <span className="font-bold text-foreground">{lang.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-extrabold text-center text-foreground mb-4">
            Why learners love CodeOwl
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Our unique approach makes learning to code as addictive as your favorite game
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div 
                key={i}
                className="p-6 bg-card rounded-2xl border border-border card-elevated text-center group hover:scale-105 transition-transform"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-primary to-[hsl(120,70%,35%)]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-primary-foreground mb-4">
            Start your coding journey today
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join thousands of learners who are building real skills, one lesson at a time.
          </p>
          <Button size="xl" variant="golden" asChild>
            <Link to="/learn">
              Get Started — It's Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-sidebar">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-primary">
                <Code2 className="w-5 h-5 text-sidebar-primary-foreground" />
              </div>
              <span className="font-bold text-sidebar-foreground">CodeOwl</span>
            </div>
            <p className="text-sm text-sidebar-foreground/70">
              © 2025 CodeOwl. Learn to code the fun way.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
