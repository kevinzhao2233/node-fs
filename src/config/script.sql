create table files
(
    id          varchar(32)                                 not null comment '文件 ID'
        primary key,
    name        varchar(256)                                not null comment '文件名',
    ext         varchar(16)                                 null comment '文件后缀',
    state       enum ('normal', 'removed') default 'normal' not null comment '文件状态',
    mime        varchar(32)                                 null comment '文件 mime 类型',
    md5         varchar(64)                                 null comment '文件 md5',
    path        varchar(512)                                null comment '文件路径',
    size        bigint                                      not null comment '文件大小（字节）',
    upload_time datetime                                    not null comment '上传时间',
    constraint files_id_uindex
        unique (id)
)
    comment '文件信息';


