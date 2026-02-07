import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { School, Phone } from 'lucide-react';
import { Icons } from '../Icons';

export default function Navbar() {
    return (
        <header className="sticky  w-full top-0 z-50 w-full border-b bg-background/95">
            <div className='w-full bg-[#2857AE] flex h-10 items-center px-4'>
                <div className='w-full flex justify-between items-center px-4 py-3'>
                    <div>
                        <p className='text-white text-sm font-normal'>Est. February 20 1990</p>
                    </div>
                    <div className="social-media flex items-center space-x-4">
                        <Link href="#" className="text-white/70 hover:text-white transition-colors">
                            <Icons.Facebook className="h-4 w-4" />
                        </Link>
                        <Link href="#" className="text-white/70 hover:text-white transition-colors">
                            <Icons.Instagram className="h-4 w-4" />
                        </Link>
                        <Link href="#" className="text-white/70 hover:text-white transition-colors">
                            <Icons.X className="h-4 w-4 fill-current" />
                        </Link>
                        <Link href="#" className="text-white/70 hover:text-white transition-colors">
                            <Icons.Linkedin className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </div>
            <div className="w-full flex h-14 items-center px-4">
                <div className="w-full h-full flex justify-between">
                    <Link href="/" className="mr-6 flex items-center space-x-2">
                        <School className="h-6 w-6" />
                        <span className="hidden font-bold sm:inline-block">
                            Logo
                        </span>
                    </Link>

                    <div className='flex items-center h-full  gap-5'>
                        <nav className="flex items-center h-full gap-5 text-sm font-medium">
                            <Link
                                href="/"
                                className="text-foreground/60 h-full transition-colors hover:text-foreground/80"
                            >
                                <div className="relative h-full flex items-center before:absolute before:bottom-0  before:left-0 before:w-0 before:h-0.5 before:bg-primary before:transition-all before:duration-300 hover:before:w-full hover:before:duration-500 hover:text-[#2857AE]">  Home</div>
                            </Link>
                            <Link
                                href="/about"
                                className="text-foreground/60 h-full transition-colors hover:text-foreground/80"
                            >
                                <div className="relative h-full flex items-center before:absolute before:bottom-0  before:left-0 before:w-0 before:h-0.5 before:bg-primary before:transition-all before:duration-300 hover:before:w-full hover:before:duration-500 hover:text-[#2857AE]">  About</div>
                            </Link>
                            <Link
                                href="/about"
                                className="text-foreground/60 h-full transition-colors hover:text-foreground/80"
                            >
                                <div className="relative h-full flex items-center before:absolute before:bottom-0  before:left-0 before:w-0 before:h-0.5 before:bg-primary before:transition-all before:duration-300 hover:before:w-full hover:before:duration-500 hover:text-[#2857AE]">  Blog</div>
                            </Link>
                            <Link
                                href="/about"
                                className="text-foreground/60 h-full transition-colors hover:text-foreground/80"
                            >
                                <div className="relative h-full flex items-center before:absolute before:bottom-0  before:left-0 before:w-0 before:h-0.5 before:bg-primary before:transition-all before:duration-300 hover:before:w-full hover:before:duration-500 hover:text-[#2857AE]">  Academic</div>
                            </Link>
                            <Link
                                href="/about"
                                className="text-foreground/60 h-full transition-colors hover:text-foreground/80"
                            >
                                <div className="relative h-full flex items-center before:absolute before:bottom-0  before:left-0 before:w-0 before:h-0.5 before:bg-primary before:transition-all before:duration-300 hover:before:w-full hover:before:duration-500 hover:text-[#2857AE]">  Gallery</div>
                            </Link>
                            <Link
                                href="/about"
                                className="text-foreground/60 h-full transition-colors hover:text-foreground/80"
                            >
                                <div className="relative h-full flex items-center before:absolute before:bottom-0  before:left-0 before:w-0 before:h-0.5 before:bg-primary before:transition-all before:duration-300 hover:before:w-full hover:before:duration-500 hover:text-[#2857AE]">  Opportunities</div>
                            </Link>

                        </nav>
                        <div className='h-full flex gap-3 items-center'>
                            <Link
                                href="/contact"
                                className="text-foreground/60 h-full transition-colors hover:text-foreground/80"
                            >
                                <div className="relative h-full flex items-center">
                                    <Phone className="h-5 w-5" />
                                </div>
                            </Link>
                            <Button>
                                <Link href="/contact" className="w-full h-full"  >Contact Us</Link>
                            </Button>

                        </div>
                    </div>

                </div>

            </div>
        </header>
    );
}
