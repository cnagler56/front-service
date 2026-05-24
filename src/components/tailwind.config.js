/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}", // Adjust this to match your file structure
    ],
    theme: {
      // 1. Set global container behavior
      container: {
        center: true,
        padding: '2rem',
        screens: {
          '2xl': '1400px',
        },
      },
      extend: {
        // 2. Functional Color Mapping
        colors: {
          farmGreen: {
            DEFAULT: "#367C2B",
            dark: "#2D6624",  // For hover states
            light: "#EBF2EA", // For soft backgrounds/alerts
          },
          farmRed: {
            DEFAULT: "#861D26",
            dark: "#6B171E",
            light: "#FDF2F3",
          },
          // Semantic aliases
          brand: {
            primary: "#367C2B",
            secondary: "#861D26",
            accent: "#FFDE00", // "Harvest Gold"
          },
          neutral: {
            950: "#0A0A0A", // Custom deep blacks for typography
          }
        },
  
        // 3. Custom Typography
        fontFamily: {
          sans: ['Inter', 'sans-serif'], // Professional/Clean
          heading: ['Montserrat', 'sans-serif'], // Bold/Impactful
        },
  
        // 4. Custom Utilities
        boxShadow: {
          'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          'elevated': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        },
        
        borderRadius: {
          'brand': '0.5rem', // Consistent curves across the UI
        },
      },
    },
    plugins: [
      require('@tailwindcss/forms'),      // Better styling for checkboxes/inputs
      require('@tailwindcss/typography'), // For styling CMS/Markdown content
      require('@tailwindcss/aspect-ratio'), // Great for product images
    ],
  }