import "dotenv/config";
import { db } from "../src/db";
import { roadmapTopics } from "../src/db/schema";
import { eq } from "drizzle-orm";

const URL_MAP: Record<string, string> = {
  "MDN Web Docs": "https://developer.mozilla.org/en-US/docs/Web",
  "MDN": "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
  "CSS Tricks": "https://css-tricks.com/snippets/css/a-guide-to-flexbox/",
  "web.dev": "https://web.dev/learn",
  "javascript.info": "https://javascript.info/",
  "react.dev": "https://react.dev/learn",
  "TanStack Query": "https://tanstack.com/query/latest",
  "tailwindcss.com": "https://tailwindcss.com/docs",
  "nodejs.org": "https://nodejs.org/en/docs",
  "REST API Tutorial": "https://restfulapi.net/",
  "OWASP Cheat Sheet": "https://cheatsheetseries.owasp.org/",
  "postgresqltutorial.com": "https://www.postgresqltutorial.com/",
  "Postgres docs": "https://www.postgresql.org/docs/",
  "testing-library.com": "https://testing-library.com/docs/",
  "docker.com": "https://docs.docker.com/get-started/",
  "docs.docker.com": "https://docs.docker.com/",
  "Docker Hub": "https://hub.docker.com/",
  "docs.github.com": "https://docs.github.com/en/actions",
  "GitHub Actions": "https://docs.github.com/en/actions/learn-github-actions",
  "vercel.com": "https://vercel.com/docs",
  "Linux Journey": "https://linuxjourney.com/",
  "Bash Guide": "https://mywiki.wooledge.org/BashGuide",
  "Cloudflare Learning": "https://www.cloudflare.com/learning/network-layer/what-is-networking/",
  "git-scm.com": "https://git-scm.com/doc",
  "kubernetes.io": "https://kubernetes.io/docs/home/",
  "helm.sh": "https://helm.sh/docs/",
  "prometheus.io": "https://prometheus.io/docs/introduction/overview/",
  "aws.amazon.com": "https://aws.amazon.com/getting-started/",
  "AWS Skill Builder": "https://explore.skillbuilder.aws/",
  "terraform.io": "https://developer.hashicorp.com/terraform/intro",
  "elastic.co": "https://www.elastic.co/guide/index.html",
  "Microsoft Learn": "https://learn.microsoft.com/en-us/training/azure/",
  "Mode SQL Tutorial": "https://mode.com/sql-tutorial/",
  "Automate the Boring Stuff": "https://automatetheboringstuff.com/",
  "pandas.pydata.org": "https://pandas.pydata.org/docs/",
  "Kaggle Learn": "https://www.kaggle.com/learn",
  "Kaggle": "https://www.kaggle.com/",
  "matplotlib.org": "https://matplotlib.org/stable/tutorials/index.html",
  "Storytelling with Data": "https://www.storytellingwithdata.com/",
  "Khan Academy": "https://www.khanacademy.org/math/statistics-probability",
  "Optimizely": "https://www.optimizely.com/optimization-glossary/ab-testing/",
  "Oracle Java Tutorials": "https://docs.oracle.com/javase/tutorial/",
  "Jenkov Tutorials": "https://jenkov.com/tutorials/java-concurrency/index.html",
  "junit.org": "https://junit.org/junit5/docs/current/user-guide/",
  "maven.apache.org": "https://maven.apache.org/guides/",
  "spring.io": "https://spring.io/guides",
  "redis.io": "https://redis.io/docs/",
  "kafka.apache.org": "https://kafka.apache.org/documentation/",
  "docs.python.org": "https://docs.python.org/3/tutorial/",
  "Real Python": "https://realpython.com/",
  "packaging.python.org": "https://packaging.python.org/en/latest/",
  "docs.djangoproject.com": "https://docs.djangoproject.com/en/stable/intro/tutorial01/",
  "fastapi.tiangolo.com": "https://fastapi.tiangolo.com/tutorial/",
  "sqlalchemy.org": "https://docs.sqlalchemy.org/en/20/tutorial/",
  "docs.pytest.org": "https://docs.pytest.org/en/stable/",
  "typescriptlang.org": "https://www.typescriptlang.org/docs/",
  "vitejs.dev": "https://vitejs.dev/guide/",
  "webaim.org": "https://webaim.org/intro/",
  "storybook.js.org": "https://storybook.js.org/docs",
  "3Blue1Brown": "https://www.3blue1brown.com/topics/linear-algebra",
  "scikit-learn": "https://scikit-learn.org/stable/tutorial/index.html",
  "d2l.ai": "https://d2l.ai/",
  "pytorch.org": "https://pytorch.org/tutorials/",
  "huggingface.co": "https://huggingface.co/docs",
  "wandb.ai": "https://docs.wandb.ai/",
};

async function main() {
  const allTopics = await db.select().from(roadmapTopics);
  let updatedCount = 0;

  for (const topic of allTopics) {
    const label = topic.resourceLabel;
    const url = (label && URL_MAP[label]) || "https://roadmap.sh";

    if (!topic.resourceUrl || topic.resourceUrl !== url) {
      await db
        .update(roadmapTopics)
        .set({ resourceUrl: url })
        .where(eq(roadmapTopics.id, topic.id));
      updatedCount++;
    }
  }

  console.log(`Successfully updated ${updatedCount} roadmap topics with working URLs!`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

