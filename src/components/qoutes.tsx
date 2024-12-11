import React, { useEffect, useState } from "react";

interface Quote {
  quote: string;
  author: string;
  category: string;
  id: number;
}

const Quotes: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch data from the API
    const fetchQuotes = async () => {
      try {
        const response = await fetch(
          "https://api.api-ninjas.com/v1/quotes?category=happiness",
          {
            headers: {
              "X-Api-Key": "5rygmb3ZnLrvapL1lNsw+Q==q8Tsncdl3ymnkubK", // Replace with your actual API key
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }

        const data: Quote[] = await response.json();

        // Check if the data is an array
        if (Array.isArray(data)) {
          setQuotes(data);
        } else {
          throw new Error("API did not return an array of quotes");
        }
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotes();
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <ul>
      {quotes.map((quote) => (
        <React.Fragment key={quote.id}>
          <li>{quote.quote}</li>
          <li>- {quote.author}</li>
        </React.Fragment>
      ))}
    </ul>
  );
};

export default Quotes;
