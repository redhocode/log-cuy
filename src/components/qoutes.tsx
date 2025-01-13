// import React, { useEffect, useState } from "react";

// interface Quote {
//   quote: string;
//   author: string;
//   category: string;
//   id: number;
// }

// const Quotes: React.FC = () => {
//   const [quotes, setQuotes] = useState<Quote[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     // Fetch data from the API
//    const fetchQuotes = async () => {
//      try {
//        const response = await fetch("https://en.wikipedia.org/w/rest.php/v1/page/random/summary", {
//          headers: {
//            'Content-Type': 'application/json'
//          }
//        });
   
//        if (!response.ok) {
//          throw new Error("Failed to fetch data");
//        }
   
//        const data = await response.json();
   
//        // Process the data to extract the quote and author
//        const quote = data.title;
//        const author = data.extract;
   
//        setQuotes([{ quote, author, category: '', id: 1 }]);
//      } catch (error) {
//        setError(error.message);
//      } finally {
//        setLoading(false);
//      }
//    };

//     fetchQuotes();
//   }, []);

//   if (loading) {
//     return <p>Loading...</p>;
//   }

//   if (error) {
//     return <p>Error: {error}</p>;
//   }

//   return (
//     <ul>
//       {quotes.map((quote) => (
//         <React.Fragment key={quote.id}>
//           <li>{quote.quote}</li>
//           <li>- {quote.author}</li>
//         </React.Fragment>
//       ))}
//     </ul>
//   );
// };

// export default Quotes;
