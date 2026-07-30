export default function ProductPage({ params }: { params: { slug: string } }) {
  return <main>Product: {params.slug}</main>;
}
