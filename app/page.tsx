import { PdpExperience } from "@/components/pdp/pdp-experience";
import { product, recommendations } from "@/lib/catalog";

export default function ProductPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    brand: { "@type": "Brand", name: "Lorem Ipsum" },
    image: product.images.map((image) => image.src),
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      price: product.price,
      priceCurrency: "INR",
    },
  };

  return (
    <>
      <PdpExperience product={product} recommendations={recommendations} />
      <script
        // JSON-LD is generated from typed local data, never user input.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        type="application/ld+json"
      />
    </>
  );
}
