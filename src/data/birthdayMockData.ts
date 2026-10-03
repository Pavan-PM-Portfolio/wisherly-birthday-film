import type { BirthdayData } from "@/lib/birthday/types";

/**
 * Mock birthday. Every word and image on the page comes from here.
 * Replace with the Wisherly birthday-view document later; the components only read this shape.
 */
export const birthdayMockData: BirthdayData = {
  name: "Alex",
  sender: "Someone Special",

  birthdayWish: "May this year bring you everything you're wishing for, and a few lovely things you never thought to ask for.",

  wishes: [
    { from: "Shreya", message: "Hope this year brings you countless reasons to smile." },
    { from: "Friends", message: "Wishing you an amazing year ahead. We'll be there for every bit of it." },
    { from: "Mum & Dad", message: "We are so proud of the person you've become. Happy birthday, love." },
    { from: "Sam", message: "May every day this year feel a little like today." },
    { from: "The team", message: "Here's to another year of big ideas and bigger laughs." },
    { from: "Priya", message: "You make every room warmer. Never stop being you." },
    { from: "Rohan", message: "Cake first, everything else later. Happy birthday!" },
    { from: "Grandma", message: "Sending you a hug the size of the moon." },
  ],

  photos: [
    { url: "/photos/photo-01.jpg", caption: "That evening by the sea", date: "June 2024" },
    { url: "/photos/photo-02.jpg", caption: "The long drive up", date: "Aug 2024" },
    { url: "/photos/photo-03.jpg", caption: "Golden hour, again", date: "Oct 2024" },
    { url: "/photos/photo-04.jpg", caption: "Wildflowers everywhere", date: "Mar 2025" },
    { url: "/photos/photo-05.jpg", caption: "Last light", date: "May 2025" },
    { url: "/photos/photo-06.jpg", caption: "Pink skies", date: "Jan 2026" },
    { url: "/photos/photo-07.jpg", caption: "Up in the hills", date: "Apr 2026" },
    { url: "/photos/photo-08.jpg", caption: "Spring, finally", date: "Jun 2026" },
  ],

  message:
    "Some people make ordinary moments feel extraordinary. You are one of them.\n\nThis little surprise was made just for you, to say thank you for every laugh, every late-night talk and every time you showed up without being asked. I hope this year is gentle with you, and full of the things that make you light up.",

  memories: [
    { title: "Our First Adventure", message: "A wrong turn, a flat tyre and the best sunset we've ever seen.", image: "/photos/photo-02.jpg", date: "Aug 2024" },
    { title: "You Are Amazing", message: "Kind, brave and endlessly curious. Never change.", image: "/photos/photo-04.jpg" },
    { title: "Always There", message: "Through every high and low, you showed up. Thank you.", image: "/photos/photo-01.jpg", date: "Always" },
    { title: "Golden Hours", message: "All those evenings we lost track of time and didn't mind one bit.", image: "/photos/photo-05.jpg", date: "May 2025" },
  ],

  gift: {
    label: "A little surprise",
    message: "A weekend away, just for you. Pack light: the tickets are already booked.",
  },

};
