-- 创建文件表
create table files (
    id varchar(32) not null comment '文件 ID' primary key,
    name varchar(256) not null comment '文件名',
    ext varchar(16) null comment '文件后缀',
    state enum ('normal', 'removed') default 'normal' not null comment '文件状态',
    mime varchar(32) null comment '文件 mime 类型',
    md5 varchar(64) null comment '文件 md5',
    path varchar(512) null comment '文件路径',
    size bigint not null comment '文件大小（字节）',
    upload_time datetime not null comment '上传时间',
    constraint files_id_uindex unique (id)
) comment '文件信息';

-- 创建传输表
create table transmission (
    id varchar(32) not null comment '传输 ID' primary key,
    description varchar(500) null comment '传输描述',
    has_password tinyint(1) default 0 null comment '下载时是否需要密码',
    password varchar(6) null comment '下载时的密码',
    expiration datetime null comment '过期时间',
    constraint transmission_id_uindex unique (id)
) comment '传输信息表';

-- 创建文件和传输的中间表
create table transmission_files (
    f_id varchar(32) null comment '外键、文件 ID',
    t_id varchar(32) null comment '外键、传输 ID',
    constraint f_id foreign key (f_id) references files (id),
    constraint t_id foreign key (t_id) references transmission (id)
) comment '传输表和文件表的中间表';