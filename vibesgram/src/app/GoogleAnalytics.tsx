import Script from "next/script";

// GA Snippet

const GoogleAnalytics = ({ id }: { id: string }) => {
  return (
    <>
      <Script
        strategy="lazyOnload"
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
      />

      <Script id="" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', '${id}');
        `}
      </Script>
    </>
  );
};

export default GoogleAnalytics;
