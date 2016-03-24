# Postgres storage

Document defining what's stored in postgres relational storage.

## User

| Attribute    | Type           |
|--------------|----------------|
| `fbUserId`   | `uint64`       |
| `name`       | `varchar<128>` |
| `pic`        | `varchar<128>` |

| Attribute        | Model | Type       | Foreign Key |
|------------------|-------|------------|-------------|
| `sentPosts`      | Post  | OneToMany  |             |
| `collectedPosts` | Post  | ManyToMany | `postId`    |
| `sharedPosts`    | Post  | ManyToMany | `postId`    |


## Post

| Attribute    | Type           |
|--------------|----------------|
| `postId`     | `uint64`       |
| `fbUserid`   | `uint64`       |
| `lat`        | `double`       |
| `lon`        | `double`       |
| `msg`        | `varchar<512>` |
| `pic`        | `varchar<128>` |

| Attribute        | Model | Type       | Foreign Key |
|------------------|-------|------------|-------------|
| `sentBy`         | User  | ManyToOne  | `fbUserId`  |
| `collectedBy`    | User  | ManyToMany | `fbUserId`  |
| `sharedWith`     | User  | ManyToMany | `fbUserId`  |
