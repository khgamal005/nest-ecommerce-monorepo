export default function CategoryPage({ params }: { params: { slug: string } }) {
  return <main>Category: {params.slug}</main>;
}
