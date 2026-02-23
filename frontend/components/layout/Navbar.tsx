"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Phone, ChevronDown } from "lucide-react";
import { Icons } from "../Icons";
import { useEffect, useState, useRef } from "react";

const socialLinks = [
  { name: "facebook", href: "#" },
  { name: "instagram", href: "#" },
  { name: "x", href: "#" },
  { name: "youtube", href: "#" },
  { name: "tiktok", href: "#" },
  { name: "whatsapp", href: "#" },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileSubmenu, setMobileSubmenu] = useState<string | null>(null);
  const lastScrollY = useRef(0);

  const navItems = [
    { name: "Home", href: "/" },
    {
      name: "About",
      href: "/about",
      subItems: [
        {
          name: "About Us",
          href: "/about",
          description: "Discover our legacy of excellence since 1990",
        },
        {
          name: "Staff & Leadership",
          href: "/staff",
          description: "Meet the team guiding our success",
        },
      ],
    },
    { name: "Blog", href: "/blog" },

    { name: "Academic", href: "/academic" },
    { name: "Gallery", href: "/gallery" },
    { name: "Opportunities", href: "/opportunities" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleMobileSubmenu = (itemName: string) => {
    setMobileSubmenu(mobileSubmenu === itemName ? null : itemName);
  };

  return (
    <header
      className={`sticky top-0 z-350 w-full border-b bg-background/95 transition-transform duration-500 ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="w-full h-full container mx-auto max-w-[1920px]">
        <div
          className={`topNav w-full bg-[#2857AE] flex items-center  overflow-hidden transition-all duration-500 ease-in-out px-5 md:px-[clamp(20px,5vw,60px)] ${
            isScrolled ? "h-0 opacity-0" : "h-[37px] opacity-100"
          }`}
        >
          <div className="w-full flex justify-between items-center py-3">
            <div>
              <p className="text-white text-sm font-normal">
                Est. February 20 1990
              </p>
            </div>
            <div className="social-media flex items-center space-x-[clamp(10px,2vw,18px)]">
              {socialLinks.map((social) => (
                <Link
                  key={social.name}
                  href={social.href}
                  className={`icon icon-${social.name} text-white/80 lg:hover:text-white transition-all h-5 w-5 flex items-center justify-center rounded-full`}
                ></Link>
              ))}
            </div>
          </div>
        </div>
        <div className="w-full flex h-[calc(var(--header-height)-37px)] items-center px-5 md:px-[clamp(20px,5vw,60px)] relative">
          <div className="w-full h-full flex justify-between items-center">
            <Link
              href="/"
              className="mr-6 h-full flex items-center space-x-2 z-50 relative"
            >
              <div className="flex items-center max-xs:gap-2 gap-4">
                {/* Placeholder Logo */}
                <div className="relative w-[40px] h-[40px] md:w-[57px] md:h-[57px]">
                  <Image
                    src="/logo/fofana.png" // User can replace
                    alt="A.M. Fofana Logo"
                    width={57}
                    height={57}
                    className="object-contain"
                  />
                  {/* Fallback if no logo: A simple text or icon */}
                </div>
                <div>
                  <h2 className="text-[clamp(18px,2.5vw,24px)] font-semibold text-primary mb-[-3px]">
                    A.M. FOFANA
                  </h2>
                  <p className="text-[clamp(9px,1.2vw,12px)] text-black tracking-widest uppercase">
                    Islamic & English High School
                  </p>
                </div>
              </div>
            </Link>

            {/* Unified Menu Wrapper */}
            <div
              className={`
                        menu-wrapper 
                        absolute top-full left-0 w-full
                        flex flex-col md:flex-row items-center gap-10 max-md:bg-primary max-md:gap-5
                        transition-all duration-300 ease-in-out
                        md:static md:w-auto md:h-full md:pointer-events-auto md:opacity-100
                        ${
                          isMobileMenuOpen
                            ? "max-md:h-[calc(100vh-80px)] max-md:opacity-100 max-md:pointer-events-auto max-md:border-b max-md:shadow-xl max-md:overflow-y-auto"
                            : "max-md:h-0 max-md:opacity-0 max-md:pointer-events-none max-md:border-b-0 max-md:shadow-none max-md:overflow-hidden md:p-0 max-md:overflow-hidden"
                        }
                    `}
            >
              <nav className="flex flex-col md:flex-row md:h-full items-start md:items-center w-full md:w-auto md:gap-5 text-sm font-medium ">
                {navItems.map((item) => (
                  <div
                    key={item.name}
                    className="group w-full md:w-auto flex flex-col md:flex-row md:h-full md:items-center relative md:static"
                  >
                    <div className="flex items-center md:h-full  justify-between w-full md:w-auto md:justify-start gap-1">
                      {item.subItems ? (
                        <div className="group/sub relative h-full max-md:h-auto max-md:w-full max-md:border-b max-md:border-white/50">
                          <div
                            className="text-foreground/60 h-auto max-md:w-full md:h-full flex items-center justify-between w-full md:w-auto transition-colors hover:text-foreground/80 py-3 md:py-0 relative cursor-pointer max-md:px-5"
                            onClick={(e) => {
                              e.preventDefault();
                              toggleMobileSubmenu(item.name);
                              // Don't close mobile menu, just toggle submenu
                            }}
                          >
                            <div className="relative max-md:text-white h-full flex items-center md:before:absolute md:before:bottom-0 md:before:left-0 md:before:w-0 md:before:h-0.5 md:before:bg-primary md:before:transition-all md:before:duration-300 md:hover:before:w-full md:hover:before:duration-500 md:hover:text-[#2857AE]">
                              {item.name}
                            </div>
                            <ChevronDown
                              className={`h-4 w-4 transition-transform max-md:text-white duration-300 ml-1 ${mobileSubmenu === item.name ? "rotate-180" : ""} md:group-hover:rotate-180`}
                            />
                          </div>
                          <div
                            className={`
                                           gap-from-15 gap-to-20 z-100! max-md:grid md:bg-white md:rounded-[10px] md:p-5 scale-100 opacity-100
                                           max-md:grid-rows-[0fr] duration-500
                                            md:group-not-[&:hover]/sub:scale-90 
                                            md:group-not-[&:hover]/sub:opacity-0 
                                              md:group-hover/sub:opacity-100 
                                              md:group-hover/sub:pointer-events-auto 
                                              md:group-hover/sub:scale-100 
                                            md:group-not-[&:hover]/sub:pointer-events-none  
                                             md:group-hover/sub:delay-200 
                                              relative max-md:w-full
                                               md:absolute md:top-full
                                                md:w-[277px] md:h-fit md:z-150 md:left-1/2 h-full md:-translate-x-1/2
                                            ${mobileSubmenu === item.name ? "max-md:grid max-md:grid-rows-[1fr] max-md:opacity-100 max-md:mt-2 max-md:relative max-md:h-full max-md:w-full" : "max-md:grid max-md:grid-rows-[0fr] max-md:opacity-0 max-md:mt-0 max-md:px-0 max-md:w-full"}
                                        
                                        `}
                          >
                            <div className="h-full w-full max-md:overflow-hidden">
                              <div className="flex flex-col max-md:w-full h-full md:gap-2 max-md:gap-[1px]">
                                {item.subItems.map((sub) => (
                                  <Link
                                    key={sub.name}
                                    href={sub.href}
                                    className="group/item relative md:pr-[35px] w-full flex justify-between items-center block max-md:bg-white py-2 md:py-3 md:px-[18px] duration-500 md:hover:text-primary md:rounded-lg md:hover:bg-primary/10 transition-colors max-md:px-5"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                  >
                                    <div>{sub.name}</div>

                                    <div className="w-[25px] max-md:hidden h-[25px] absolute right-3 duration-500 scale-75 group-hover/item:scale-100 group-hover/item:opacity-100 opacity-0 top-1/2 -translate-y-1/2 bg-primary rounded-full flex justify-center items-center">
                                      <svg
                                        className="w-[13px] h-[13px] scale-75 duration-500 group-hover/item:scale-100 group-hover/item:opacity-100 opacity-0"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 13 13"
                                        fill="none"
                                      >
                                        <path
                                          d="M12.3136 0.999966C12.3136 0.447681 11.8659 -3.44143e-05 11.3136 -3.39928e-05L2.31363 -3.38664e-05C1.76135 -3.42035e-05 1.31363 0.447681 1.31363 0.999966C1.31363 1.55225 1.76135 1.99997 2.31363 1.99997L10.3136 1.99997L10.3136 9.99997C10.3136 10.5523 10.7613 11 11.3136 11C11.8659 11 12.3136 10.5523 12.3136 9.99997L12.3136 0.999966ZM0.707031 11.6066L1.41414 12.3137L12.0207 1.70707L11.3136 0.999966L10.6065 0.292859L-7.55191e-05 10.8995L0.707031 11.6066Z"
                                          fill="white"
                                        />
                                      </svg>
                                    </div>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <Link
                          href={item.href}
                          className="text-foreground/60 h-auto md:h-full max-md:w-full   max-md:border-b max-md:border-white/50 flex items-center transition-colors hover:text-foreground/80 py-3 md:py-0 relative"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <div className="relative h-full max-md:text-white flex items-center md:before:absolute md:before:bottom-0 max-md:px-5 md:before:left-0 md:before:w-0 md:before:h-0.5 md:before:bg-primary md:before:transition-all md:before:duration-300 md:hover:before:w-full md:hover:before:duration-500 md:hover:text-[#2857AE]">
                            {item.name}
                          </div>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </nav>
              <div className="flex flex-col md:flex-row w-full md:w-auto gap-5 items-center mt-4 md:mt-0 max-md:px-5">
                <a
                  href="tel:+1234567890"
                  className="text-foreground/60 h-auto md:h-full transition-colors hover:text-foreground/80 hidden md:flex items-center"
                >
                  <div className="relative h-full flex items-center">
                    <Phone className="h-5 w-5" />
                  </div>
                </a>

                <div className="w-full md:w-auto max-md:text-primary rounded-full max-md:bg-white">
                  <a
                    href="/contact"
                    className="w-full h-full py-3 px-5 flex items-center justify-center transition-colors max-md:text-primary max-md:bg-white lg:hover:bg-primary/10 lg:hover:text-primary bg-primary border border-primary/0 lg:hover:border-primary text-white duration-500 rounded-full text-sm font-medium"
                  >
                    Contact Us
                  </a>
                </div>
              </div>
            </div>

            {/* Hamburger Button */}
            <div className="hidden w-fit h-fit max-md:flex justify-center items-center">
              <div
                onClick={toggleMobileMenu}
                className="
                        hamburger-menu group/burger relative cursor-pointer flex flex-col justify-between w-[26px] h-[18px]
                       "
              >
                <span
                  className={`
                        ${
                          isMobileMenuOpen
                            ? "bg-[var(--color-primary)] relative  duration-300 translate-y-[8px] h-[2px] rotate-[45deg] opacity-100"
                            : "bg-[var(--color-primary)] h-[2px] relative opacity-100 duration-300"
                        }
                    `}
                ></span>
                <span
                  className={`
                        ${
                          isMobileMenuOpen
                            ? "bg-[var(--color-primary)] relative  duration-300 opacity-0 h-[2px]"
                            : "bg-[var(--color-primary)] h-[2px] relative opacity-100 duration-300"
                        }
                    `}
                ></span>
                <span
                  className={`
                        ${
                          isMobileMenuOpen
                            ? "bg-[var(--color-primary)] relative  duration-300 translate-y-[-8px] h-[2px] rotate-[-45deg] opacity-100"
                            : "bg-[var(--color-primary)] h-[2px] relative opacity-100 duration-300"
                        }
                    `}
                ></span>{" "}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
