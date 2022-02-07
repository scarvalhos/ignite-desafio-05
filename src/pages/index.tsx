import { useState } from 'react';

import { GetStaticProps } from 'next';
import Head from 'next/head'
import Link from 'next/link'

import Prismic from '@prismicio/client'
import { RichText } from 'prismic-dom'
import { getPrismicClient } from '../services/prismic';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { FiCalendar, FiUser } from 'react-icons/fi';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Header from '../components/Header';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}

export default function Home({ postsPagination, preview }: HomeProps) {
  const [posts, setPosts] = useState<PostPagination>({
    ...postsPagination,
    results: postsPagination.results.map(post => ({
      ...post,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        {
          locale: ptBR,
        }
      ),
    })),
  });

  async function loadMorePosts() {
    const response = await fetch(`${posts.next_page}`).then(data =>
      data.json()
    );

    const postsResponseResults = response.results.map(post => ({
      ...post,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        {
          locale: ptBR,
        }
      ),
    }));

    const newPosts = {
      ...posts,
      next_page: response.next_page,
      results: [...posts.results, ...postsResponseResults],
    };

    setPosts(newPosts);
  };

  return (
    <>
      <Head>
        <title>Home | Spacetravaling</title>
      </Head>

      <Header />

      <main className={styles.container}>
        <section>
          {posts.results.map(post => (
            <article className={styles.postContent} key={post.uid}>
              <Link href={`/post/${post.uid}`}>
              <a>
                  <h1>{post.data.title}</h1>
                  <p>{post.data.subtitle}</p>
                  <div>
                    <time>
                      <FiCalendar />
                      {post.first_publication_date}
                    </time>
                    <span>
                      <FiUser />
                      {post.data.author}
                    </span>
                  </div>
                </a>
              </Link>
            </article>
          ))}
          {posts.next_page && (
            <button type="button" onClick={loadMorePosts}>
              Carregar mais posts
            </button>
          )}
          {preview && (
            <aside className={commonStyles.exitPreviewButton}>
              <Link href="/api/exit-preview">
                <a>Sair do modo Preview</a>
              </Link>
            </aside>
          )}
        </section>
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async ({ preview = false, previewData }) => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'posts'),
  ], {
      pageSize: 1,
      ref: previewData?.ref ?? null,
  })

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: postsResponse.results,
  }

  return {
    props: {
      postsPagination,
      preview
    },
    revalidate: 60 * 5, // 5 minutos
  }
};
