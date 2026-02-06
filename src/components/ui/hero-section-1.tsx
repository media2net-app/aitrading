import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimatedGroup } from '@/components/ui/animated-group'
import { cn } from '@/lib/utils'

const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: 'blur(12px)',
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      transition: {
        type: 'spring' as const,
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
}

export function HeroSection() {
  return (
    <>
      <HeroHeader />
      <main className="overflow-hidden">
        <div
          aria-hidden
          className="z-[2] pointer-events-none isolate opacity-50 contain-strict absolute inset-0 hidden lg:block"
        >
          <div className="absolute left-0 top-0 h-[80rem] w-[35rem] -translate-y-[350px] -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
          <div className="absolute left-0 top-0 h-[80rem] w-56 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
          <div className="absolute left-0 top-0 h-[80rem] w-56 -translate-y-[350px] -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
        </div>
        <section>
          <div className="relative pb-20 pt-24 md:pt-36">
            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      delayChildren: 1,
                    },
                  },
                },
                item: {
                  hidden: {
                    opacity: 0,
                    y: 20,
                  },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                      type: 'spring',
                      bounce: 0.3,
                      duration: 2,
                    },
                  },
                },
              }}
              className="absolute inset-0 -z-20"
            >
              <img
                src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1920"
                alt="background"
                className="absolute inset-x-0 top-56 -z-20 hidden lg:block lg:top-32"
                width="1920"
                height="1080"
              />
            </AnimatedGroup>
            <div
              aria-hidden
              className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--background)_75%)]"
              style={{
                background: 'radial-gradient(125% 125% at 50% 100%, transparent 0%, hsl(var(--background)) 75%)',
              }}
            />
            <div className="mx-auto max-w-7xl px-6">
              <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
                <AnimatedGroup variants={transitionVariants}>
                  <Link
                    to="/login"
                    className="bg-muted group mx-auto flex w-fit items-center gap-4 rounded-full border border-white/5 p-1 pl-4 shadow-md shadow-black/5 transition-all duration-300 hover:bg-background"
                  >
                    <span className="text-sm text-foreground">
                      AI Bot voor XAU/USD
                    </span>
                    <span className="block h-4 w-0.5 border-l border-white/10 bg-white/10" />
                    <div className="size-6 overflow-hidden rounded-full bg-background duration-500 group-hover:bg-muted">
                      <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3" />
                        </span>
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3" />
                        </span>
                      </div>
                    </div>
                  </Link>

                  <h1 className="mx-auto mt-8 max-w-4xl text-balance text-3xl font-bold leading-tight text-foreground sm:text-4xl md:mt-10 md:text-5xl lg:mt-16 lg:text-6xl xl:text-[3.5rem]">
                    AI Trading.software Bot voor XAU/USD
                  </h1>
                  <p className="mx-auto mt-8 max-w-2xl text-balance text-lg text-muted-foreground">
                    Goud (XAU/USD) beweegt volop. Onze AI bot handelt op korte timeframes (5m en 15m)
                    met een vaste strategie en behaalt gemiddeld 94% winst. Geen Forex-ervaring nodig.
                  </p>
                </AnimatedGroup>

                <AnimatedGroup
                  variants={{
                    container: {
                      visible: {
                        transition: {
                          staggerChildren: 0.05,
                          delayChildren: 0.75,
                        },
                      },
                    },
                    ...transitionVariants,
                  }}
                  className="mt-12 flex flex-col items-center justify-center gap-2 md:flex-row"
                >
                  <div
                    key={1}
                    className="rounded-[14px] border border-foreground/10 bg-foreground/10 p-0.5"
                  >
                    <Button
                      asChild
                      size="lg"
                      className="rounded-xl px-5 text-base !text-white"
                    >
                      <Link to="/#calculator">
                        <span className="text-nowrap">Voorbeeld calculator instellingen bot winst/verlies</span>
                      </Link>
                    </Button>
                  </div>
                </AnimatedGroup>
              </div>
            </div>

          </div>
        </section>
      </main>
    </>
  )
}

const menuItems = [
  { name: 'Wat is de AI Trading Bot?', href: '/#features' },
  { name: 'Calculator & Simulator', href: '/#calculator' },
  { name: 'Hoe het werkt', href: '/#hoe-werkt-het' },
]

const HeroHeader = () => {
  const [menuState, setMenuState] = React.useState(false)
  const [isScrolled, setIsScrolled] = React.useState(false)

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  React.useEffect(() => {
    if (menuState && typeof window !== 'undefined' && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [menuState])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full">
      <nav
        data-state={menuState ? 'active' : undefined}
        className={cn(
          'group w-full outline-none transition-all duration-300',
          'lg:px-2',
          'bg-background/95 backdrop-blur-md border-b border-border/50',
          'lg:bg-transparent lg:border-b-0 lg:backdrop-blur-none',
          isScrolled && 'lg:px-2',
        )}
        style={{ paddingTop: 'env(safe-area-inset-top, 0)' }}
      >
        <div
          className={cn(
            'mx-auto max-w-6xl px-4 transition-all duration-300 sm:px-6 lg:px-12',
            'lg:mt-2',
            isScrolled &&
              'lg:max-w-4xl lg:rounded-2xl lg:border lg:border-border lg:border-border/80 lg:bg-background/50 lg:shadow-[0_0_0_1px_hsl(var(--background))] lg:backdrop-blur-lg lg:px-5',
          )}
        >
          <div className="relative flex flex-wrap items-center justify-between gap-4 py-3 lg:gap-0 lg:py-4">
            <div className="relative z-30 flex min-h-[44px] w-full items-center justify-between lg:w-auto lg:min-h-0 lg:z-auto">
              <Link to="/" aria-label="home" className="flex items-center space-x-2">
                <Logo />
              </Link>

              <button
                type="button"
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState ? 'Menu sluiten' : 'Menu openen'}
                aria-expanded={menuState}
                className="relative z-30 flex size-11 shrink-0 items-center justify-center rounded-lg lg:hidden hover:bg-foreground/5 active:bg-foreground/10"
              >
                <Menu className="size-6 duration-200 group-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0" />
                <X className="absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200 group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100" />
              </button>
            </div>

            <div className="absolute inset-0 m-auto hidden size-fit lg:block" aria-hidden={menuState}>
              <ul className="flex gap-8 text-sm">
                {menuItems.map((item, index) => (
                  <li key={index}>
                    <a
                      href={item.href}
                      className="block text-muted-foreground duration-150 hover:text-foreground"
                      onClick={(e) => {
                        e.preventDefault()
                        const targetId = item.href.replace('/#', '')
                        const element = document.getElementById(targetId)
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth' })
                        }
                      }}
                    >
                      <span>{item.name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mobile: overlay onder header (ondoorzichtige achtergrond); desktop: inline nav */}
            <div
              className={cn(
                'hidden flex-col gap-6 lg:flex lg:flex-row lg:items-center lg:w-fit',
                'group-data-[state=active]:flex',
                'fixed inset-0 z-20 border-t border-border/50 px-4 pb-8 shadow-lg',
                'bg-[hsl(var(--background))]',
                'pt-[calc(env(safe-area-inset-top,0px)+4rem)]',
                'lg:static lg:inset-auto lg:border-0 lg:bg-transparent lg:px-0 lg:pt-0 lg:pb-0 lg:shadow-none',
              )}
            >
              <div className="lg:hidden">
                <ul className="space-y-1 text-base">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <a
                        href={item.href}
                        className="block rounded-lg py-3 px-3 text-muted-foreground duration-150 hover:bg-foreground/5 hover:text-foreground"
                        onClick={(e) => {
                          e.preventDefault()
                          const targetId = item.href.replace('/#', '')
                          const element = document.getElementById(targetId)
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth' })
                          }
                          setMenuState(false)
                        }}
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 lg:w-auto">
                <Button
                  asChild
                  variant="default"
                  size="sm"
                  className="w-full sm:w-auto"
                  style={{ color: 'white' }}
                >
                  <Link to="/signup" onClick={() => setMenuState(false)}><span className="font-bold">Ja</span>, ik wil mij aanmelden</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}

const Logo = ({ className }: { className?: string }) => (
  <span
    className={cn('text-xl font-semibold text-foreground', className)}
  >
    AI Trading.software
  </span>
)
