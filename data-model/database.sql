/*
 * MapMyMountains database
 *
 * Optimized for PostgreSQL
 */

-------------------------------------------------------------------------------
-- Users
-------------------------------------------------------------------------------

CREATE TABLE permission (
    id  text  PRIMARY KEY
);

CREATE TABLE mmm_user (
    id                  text       PRIMARY KEY,
    creation_time       timestamp  NOT NULL,
    email               text       NOT NULL,
    preferred_area      polygon,
    password_hash       bytea      NOT NULL,
    salt                bytea      NOT NULL,
    activation_code     text       NOT NULL,
    active              boolean    NOT NULL DEFAULT FALSE,
    ignore              boolean    NOT NULL DEFAULT FALSE,
    view_tutorial       boolean    NOT NULL DEFAULT FALSE,
    pass_recovery_code  text
);

CREATE TABLE user_permission (
    user_id        text  REFERENCES mmm_user (id) ON DELETE CASCADE ON UPDATE CASCADE,
    permission_id  text  REFERENCES permission (id),
    PRIMARY KEY (user_id, permission_id)
);

CREATE TABLE access_token (
    id             serial     PRIMARY KEY,
    mmm_user_id    text       NOT NULL REFERENCES mmm_user (id) ON DELETE CASCADE ON UPDATE CASCADE,
    creation_time  timestamp  NOT NULL,
    token          text       NOT NULL
);

-- permissions
INSERT INTO permission VALUES
    ('create_annotation'),
    ('create_campaign'),
    ('edit_element'),
    ('upload_peaks'),
    ('view_stats'),
    ('edit_users'),
    ('search');

-------------------------------------------------------------------------------
-- Data sources
-------------------------------------------------------------------------------

CREATE TYPE element_type AS ENUM ('peak');
CREATE TYPE source_type AS ENUM ('public', 'invisible', 'dem_extracted');
CREATE TYPE source_reference_type AS ENUM ('cgn', 'osm', 'ct10', 'geonames', 'custom');
CREATE TYPE osm_type AS ENUM ('node', 'way', 'relation');

CREATE TABLE snapshot (
    id             serial     PRIMARY KEY,
    creation_time  timestamp  NOT NULL,
    description    text       NOT NULL
);

CREATE TABLE snapshot_element (
    id                         serial        PRIMARY KEY,
    snapshot_id                int           NOT NULL REFERENCES snapshot (id) ON DELETE CASCADE ON UPDATE CASCADE,
    element_id                 int           NOT NULL,
    type                       element_type  NOT NULL,
    elevation                  float,
    coordinates                point,
    name                       text,
    alternate_names            text[][], -- array of [isolanguage, alternate_name]
    wikidata_id                text,
    wikipedia_link             text
);

CREATE TABLE source (
    id                  text         PRIMARY KEY,
    description         text         NOT NULL,
    general_confidence  float        NOT NULL,
    type                source_type  NOT NULL
);

CREATE TABLE source_element (
    id                    serial        NOT NULL,
    version               int           NOT NULL DEFAULT 0,
    element_id            int,
    source_id             text          NOT NULL REFERENCES source (id) ON DELETE CASCADE ON UPDATE CASCADE,
    type                  element_type  NOT NULL,
    creation_time         timestamp,
    valid                 boolean       NOT NULL DEFAULT TRUE,
    elevation             float,
    coordinates           point,
    name                  text,
    wikidata_id           text,
    wikipedia_link        text,
    area_group            box[],
    PRIMARY KEY (id, version)
);

CREATE INDEX ON source_element (element_id);
CREATE INDEX ON source_element (source_id);
CREATE INDEX ON source_element USING gist (coordinates);

CREATE TABLE source_element_alt_name (
    id                      serial  PRIMARY KEY,
    source_element_id       int     NOT NULL,
    source_element_version  int     NOT NULL,
    isolanguage             text,
    alternate_name          text    NOT NULL,
    FOREIGN KEY (source_element_id, source_element_version) REFERENCES source_element(id, version) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX ON source_element_alt_name (source_element_id, source_element_version);

CREATE TABLE source_reference (
    source_element_id  int                    PRIMARY KEY, -- cannot mark with FOREIGN KEY because source_element (id) is not UNIQUE
    type               source_reference_type  NOT NULL,
    cgn_toponymic_id   uuid,
    ct10_cod_ele       text,
    osm_type           osm_type,
    osm_id             bigint,
    osm_version        int,
    geoname_id         int,
    geoname_mtime      date,
    custom_id          text
);

CREATE INDEX ON source_reference (custom_id);

CREATE TABLE source_element_similarity (
    source_element1_id       int  NOT NULL,
    source_element1_version  int  NOT NULL,
    source_element2_id       int  NOT NULL,
    source_element2_version  int  NOT NULL,
    PRIMARY KEY (source_element1_id, source_element1_version, source_element2_id, source_element2_version),
    FOREIGN KEY (source_element1_id, source_element1_version) REFERENCES source_element(id, version) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (source_element2_id, source_element2_version) REFERENCES source_element(id, version) ON DELETE CASCADE ON UPDATE CASCADE,
    CHECK (source_element1_id > source_element2_id)
);

CREATE TABLE merger (
    id           serial     PRIMARY KEY,
    merger_time  timestamp  NOT NULL,
    description  text       NOT NULL
);

CREATE TABLE merger_change (
    id              serial  PRIMARY KEY,
    merger_id       int     NOT NULL REFERENCES merger(id) ON DELETE CASCADE ON UPDATE CASCADE,
    old_element_id  int     NOT NULL,
    new_element_id  int     NOT NULL
);

CREATE TABLE area (
    id             text  PRIMARY KEY,
    user_id        text  REFERENCES mmm_user (id) ON DELETE CASCADE ON UPDATE CASCADE,
    creation_time        timestamp,
    boundary             polygon
);

-------------------------------------------------------------------------------
-- Annotations
-------------------------------------------------------------------------------

CREATE TABLE campaign (
    id             serial           PRIMARY KEY,
    name           text             NOT NULL,
    description    text             NOT NULL,
    user_id        text             NOT NULL REFERENCES mmm_user (id) ON DELETE CASCADE ON UPDATE CASCADE,
    creation_time  timestamp        NOT NULL,
    start_time     timestamp        NOT NULL,
    end_time       timestamp        NOT NULL,
    source_id      text             NOT NULL REFERENCES source (id),
    ref_source_id  text             REFERENCES source (id),
    boundary       polygon          NOT NULL
);

CREATE TABLE annotation (
    id                       serial     PRIMARY KEY,
    user_id                  text       NOT NULL REFERENCES mmm_user (id) ON DELETE CASCADE ON UPDATE CASCADE,
    campaign_id              int        REFERENCES campaign (id) ON DELETE CASCADE ON UPDATE CASCADE,
    source_element_id        int,
    source_element_version   int,
    creation_time            timestamp  NOT NULL,
    processed_time           timestamp,
    similar_element_id       int,
    similar_element_version  int,
    valid                    boolean    NOT NULL DEFAULT TRUE,
    name                     text,
    coordinates              point,
    elevation                float,
    wikipedia_link           text,
    wikidata_id              text,
    FOREIGN KEY (source_element_id, source_element_version) REFERENCES source_element(id, version),
    FOREIGN KEY (similar_element_id, similar_element_version) REFERENCES source_element(id, version)
);

CREATE INDEX ON annotation (campaign_id);

CREATE TABLE annotation_alt_name (
    id                          serial  PRIMARY KEY,
    annotation_id               int     NOT NULL REFERENCES annotation (id) ON DELETE CASCADE ON UPDATE CASCADE,
    source_element_alt_name_id  int     REFERENCES source_element_alt_name (id),
    isolanguage                 text,
    alternate_name              text    NOT NULL
);
